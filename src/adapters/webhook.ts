/**
 * Webhook Channel Adapter for Raw Claw v3
 *
 * REST API endpoint that receives POST requests and returns JSON responses.
 * For headless/API integration: CI/CD pipelines, external automations,
 * custom frontends, mobile apps.
 *
 * Endpoints:
 *   POST /api/message   — Send a message, get a response
 *   GET  /api/health     — Health check
 *   GET  /api/status     — Agent status
 *
 * Auth: x-api-key header matching WEBHOOK_API_KEY env var.
 *
 * Required env vars:
 *   WEBHOOK_API_KEY    — Secret key for authenticating requests
 *
 * Optional:
 *   WEBHOOK_PORT       — Port to listen on (default: uses shared dashboard port)
 */

import { Hono } from 'hono';
import { serve } from '@hono/node-server';

import {
  ChannelAdapter,
  IncomingMessage,
  SendOptions,
  AdapterInitResult,
} from './base.js';
import { readEnvFile } from '../env.js';
import { logger } from '../logger.js';

// ── Configuration ───────────────────────────────────────────────────

const envConfig = readEnvFile([
  'WEBHOOK_API_KEY',
  'WEBHOOK_PORT',
]);

const API_KEY = process.env.WEBHOOK_API_KEY || envConfig.WEBHOOK_API_KEY || '';
const WEBHOOK_PORT = parseInt(process.env.WEBHOOK_PORT || envConfig.WEBHOOK_PORT || '0', 10);

// ── Types ───────────────────────────────────────────────────────────

interface WebhookRequest {
  /** The message text to send to the agent */
  message: string;
  /** Optional thread/conversation ID for session continuity */
  threadId?: string;
  /** Optional metadata to pass through */
  metadata?: Record<string, unknown>;
}

interface WebhookResponse {
  /** Whether the request was successful */
  ok: boolean;
  /** The agent's response text */
  response?: string;
  /** Thread ID for continuing the conversation */
  threadId?: string;
  /** Error message if ok=false */
  error?: string;
  /** Processing duration in milliseconds */
  durationMs?: number;
}

// ── Pending Response Tracking ───────────────────────────────────────

// When a webhook message is received, we queue it and wait for the response.
// The response comes back via sendResponse() from the orchestration layer.

interface PendingRequest {
  resolve: (response: string) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

const pendingRequests = new Map<string, PendingRequest>();
let requestCounter = 0;

// ── Adapter ─────────────────────────────────────────────────────────

export class WebhookAdapter extends ChannelAdapter {
  private app: Hono | null = null;
  private server: ReturnType<typeof serve> | null = null;

  /**
   * Callback invoked when a normalized message arrives.
   */
  onMessage: ((msg: IncomingMessage) => Promise<void>) | null = null;

  /**
   * Callback for status/health queries.
   */
  onStatusQuery: (() => Promise<Record<string, unknown>>) | null = null;

  get channelName(): string {
    return 'Webhook';
  }

  get supportsStreaming(): boolean {
    return false;
  }

  get enabled(): boolean {
    return !!API_KEY;
  }

  /**
   * Get the Hono app for mounting on an existing server.
   * If WEBHOOK_PORT is 0 (default), the webhook routes can be mounted
   * on the dashboard's Hono instance instead of starting a separate server.
   */
  getApp(): Hono | null {
    return this.app;
  }

  async init(): Promise<AdapterInitResult> {
    if (!this.enabled) {
      return { ok: false, message: 'Webhook adapter disabled: WEBHOOK_API_KEY not set' };
    }

    this.app = new Hono();

    // ── Auth middleware ──────────────────────────────────────────────

    this.app.use('/api/*', async (c, next) => {
      const key = c.req.header('x-api-key');
      if (key !== API_KEY) {
        return c.json({ ok: false, error: 'Unauthorized' } as WebhookResponse, 401);
      }
      await next();
    });

    // ── POST /api/message ───────────────────────────────────────────

    this.app.post('/api/message', async (c) => {
      const startTime = Date.now();

      let body: WebhookRequest;
      try {
        body = await c.req.json<WebhookRequest>();
      } catch {
        return c.json({ ok: false, error: 'Invalid JSON body' } as WebhookResponse, 400);
      }

      if (!body.message || typeof body.message !== 'string') {
        return c.json({ ok: false, error: 'Missing "message" field' } as WebhookResponse, 400);
      }

      // Generate a unique request ID for tracking
      const requestId = `webhook-${++requestCounter}-${Date.now()}`;
      const threadId = body.threadId || requestId;

      // Create a promise that resolves when sendResponse is called
      const responsePromise = new Promise<string>((resolve, reject) => {
        pendingRequests.set(requestId, {
          resolve,
          reject,
          timestamp: Date.now(),
        });

        // Timeout after 5 minutes
        setTimeout(() => {
          if (pendingRequests.has(requestId)) {
            pendingRequests.delete(requestId);
            reject(new Error('Request timed out after 300s'));
          }
        }, 300_000);
      });

      // Normalize and forward the message
      const normalized: IncomingMessage = {
        threadId,
        text: body.message,
        attachments: [],
        metadata: {
          requestId,
          threadId,
          source: 'webhook',
          ...body.metadata,
        },
        userName: 'webhook',
        userId: 'webhook',
      };

      if (this.onMessage) {
        // Fire and don't await — the response comes via sendResponse
        void this.onMessage(normalized).catch((err) => {
          const pending = pendingRequests.get(requestId);
          if (pending) {
            pendingRequests.delete(requestId);
            pending.reject(err instanceof Error ? err : new Error(String(err)));
          }
        });
      } else {
        pendingRequests.delete(requestId);
        return c.json({ ok: false, error: 'No message handler configured' } as WebhookResponse, 503);
      }

      // Wait for the response
      try {
        const response = await responsePromise;
        const durationMs = Date.now() - startTime;

        return c.json({
          ok: true,
          response,
          threadId,
          durationMs,
        } as WebhookResponse);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        return c.json({ ok: false, error: errMsg } as WebhookResponse, 500);
      }
    });

    // ── GET /api/health ─────────────────────────────────────────────

    this.app.get('/api/health', (c) => {
      return c.json({ ok: true, adapter: 'webhook', timestamp: Date.now() });
    });

    // ── GET /api/status ─────────────────────────────────────────────

    this.app.get('/api/status', async (c) => {
      if (this.onStatusQuery) {
        const status = await this.onStatusQuery();
        return c.json({ ok: true, ...status });
      }
      return c.json({ ok: true, status: 'running' });
    });

    return { ok: true, message: 'Webhook adapter initialized' };
  }

  /**
   * Start the webhook HTTP server (only if WEBHOOK_PORT is set).
   * If WEBHOOK_PORT is 0, the routes should be mounted on an existing server.
   */
  async start(): Promise<void> {
    if (!this.app) throw new Error('WebhookAdapter not initialized');

    if (WEBHOOK_PORT > 0) {
      this.server = serve({
        fetch: this.app.fetch,
        port: WEBHOOK_PORT,
      });
      logger.info({ port: WEBHOOK_PORT }, 'Webhook adapter listening');
    } else {
      logger.info('Webhook adapter ready (mount on existing server via getApp())');
    }
  }

  async shutdown(): Promise<void> {
    if (this.server) {
      (this.server as any).close?.();
      this.server = null;
    }

    // Reject all pending requests
    for (const [id, pending] of pendingRequests) {
      pending.reject(new Error('Adapter shutting down'));
      pendingRequests.delete(id);
    }
  }

  async receive(event: unknown): Promise<IncomingMessage | null> {
    // Webhook messages are already normalized in the POST handler
    return event as IncomingMessage;
  }

  async acknowledge(_metadata: Record<string, unknown>): Promise<void> {
    // No-op for webhook — the HTTP response IS the acknowledgment
  }

  startTypingIndicator(_metadata: Record<string, unknown>): () => void {
    // No-op for webhook — no real-time indicator
    return () => {};
  }

  async sendResponse(
    threadId: string,
    text: string,
    metadata: Record<string, unknown>,
    _options?: SendOptions,
  ): Promise<void> {
    const requestId = metadata.requestId as string;
    if (!requestId) return;

    const pending = pendingRequests.get(requestId);
    if (pending) {
      pendingRequests.delete(requestId);
      pending.resolve(text);
    }
  }
}
