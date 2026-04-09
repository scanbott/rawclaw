/**
 * Slack Channel Adapter for Raw Claw v3
 *
 * Uses @slack/bolt for real-time message handling.
 * Thread-based conversations: each session maps to a Slack thread.
 * Supports slash commands: /rawclaw, /agent, /status.
 *
 * Required env vars:
 *   SLACK_ADAPTER_BOT_TOKEN    — xoxb-... bot token
 *   SLACK_ADAPTER_APP_TOKEN    — xapp-... app-level token (for socket mode)
 *   SLACK_ADAPTER_CHANNEL_ID   — Channel to listen in
 *
 * Optional:
 *   SLACK_ADAPTER_SIGNING_SECRET — For HTTP mode (webhook) instead of socket mode
 */

import {
  ChannelAdapter,
  IncomingMessage,
  SendOptions,
  AdapterInitResult,
  smartSplit,
} from './base.js';
import { readEnvFile } from '../env.js';
import { logger } from '../logger.js';

// ── Constants ───────────────────────────────────────────────────────

const MAX_MESSAGE_LENGTH = 4000; // Slack's actual limit is ~4000 for text blocks

// ── Configuration ───────────────────────────────────────────────────

const envConfig = readEnvFile([
  'SLACK_ADAPTER_BOT_TOKEN',
  'SLACK_ADAPTER_APP_TOKEN',
  'SLACK_ADAPTER_CHANNEL_ID',
  'SLACK_ADAPTER_SIGNING_SECRET',
]);

const BOT_TOKEN = process.env.SLACK_ADAPTER_BOT_TOKEN || envConfig.SLACK_ADAPTER_BOT_TOKEN || '';
const APP_TOKEN = process.env.SLACK_ADAPTER_APP_TOKEN || envConfig.SLACK_ADAPTER_APP_TOKEN || '';
const CHANNEL_ID = process.env.SLACK_ADAPTER_CHANNEL_ID || envConfig.SLACK_ADAPTER_CHANNEL_ID || '';
const SIGNING_SECRET = process.env.SLACK_ADAPTER_SIGNING_SECRET || envConfig.SLACK_ADAPTER_SIGNING_SECRET || '';

// ── Types for @slack/bolt (lazy-loaded) ─────────────────────────────

interface SlackApp {
  start(): Promise<unknown>;
  stop(): Promise<void>;
  message(handler: (args: SlackMessageArgs) => Promise<void>): void;
  command(name: string, handler: (args: SlackCommandArgs) => Promise<void>): void;
  client: SlackWebClient;
}

interface SlackWebClient {
  chat: {
    postMessage(args: {
      channel: string;
      text?: string;
      thread_ts?: string;
      blocks?: unknown[];
      mrkdwn?: boolean;
    }): Promise<{ ok: boolean; ts: string }>;
  };
  reactions: {
    add(args: { channel: string; timestamp: string; name: string }): Promise<void>;
  };
}

interface SlackMessageArgs {
  message: {
    text?: string;
    user?: string;
    ts: string;
    thread_ts?: string;
    channel: string;
    subtype?: string;
    bot_id?: string;
    files?: Array<{
      url_private_download: string;
      name: string;
      mimetype: string;
    }>;
  };
  say: (text: string | object) => Promise<unknown>;
  client: SlackWebClient;
}

interface SlackCommandArgs {
  command: {
    text: string;
    user_id: string;
    user_name: string;
    channel_id: string;
  };
  ack: () => Promise<void>;
  respond: (text: string | object) => Promise<void>;
  client: SlackWebClient;
}

// ── Thread Tracking ─────────────────────────────────────────────────

// Map user IDs to their most recent thread_ts for conversation continuity
const userThreads = new Map<string, string>();

// ── Adapter ─────────────────────────────────────────────────────────

export class SlackAdapter extends ChannelAdapter {
  private app: SlackApp | null = null;

  /**
   * Callback invoked when a normalized message arrives.
   */
  onMessage: ((msg: IncomingMessage) => Promise<void>) | null = null;

  /**
   * Callback for slash commands that need special handling.
   * Keys: 'rawclaw', 'agent', 'status'
   */
  onSlashCommand: ((command: string, args: string, metadata: Record<string, unknown>) => Promise<string>) | null = null;

  get channelName(): string {
    return 'Slack';
  }

  get supportsStreaming(): boolean {
    return false;
  }

  get enabled(): boolean {
    return !!BOT_TOKEN && !!CHANNEL_ID && (!!APP_TOKEN || !!SIGNING_SECRET);
  }

  async init(): Promise<AdapterInitResult> {
    if (!this.enabled) {
      return {
        ok: false,
        message: 'Slack adapter disabled: SLACK_ADAPTER_BOT_TOKEN, SLACK_ADAPTER_CHANNEL_ID, and SLACK_ADAPTER_APP_TOKEN or SLACK_ADAPTER_SIGNING_SECRET required',
      };
    }

    // Lazy-load @slack/bolt
    let BoltApp: new (config: Record<string, unknown>) => SlackApp;
    try {
      // @ts-expect-error — @slack/bolt is an optional dependency, may not be installed
      const bolt = await import('@slack/bolt');
      BoltApp = bolt.App as unknown as typeof BoltApp;
    } catch {
      return { ok: false, message: '@slack/bolt not installed. Run: npm install @slack/bolt' };
    }

    const appConfig: Record<string, unknown> = {
      token: BOT_TOKEN,
    };

    if (APP_TOKEN) {
      // Socket Mode (recommended for development and small installs)
      appConfig.socketMode = true;
      appConfig.appToken = APP_TOKEN;
    } else if (SIGNING_SECRET) {
      // HTTP Mode (for production with webhook URL)
      appConfig.signingSecret = SIGNING_SECRET;
    }

    this.app = new BoltApp(appConfig);

    // ── Message handler ───────────────────────────────────────────────

    this.app.message(async ({ message, client }) => {
      // Ignore bot messages
      if (message.subtype === 'bot_message' || message.bot_id) return;

      // Only listen in configured channel
      if (message.channel !== CHANNEL_ID) return;

      const normalized = await this.receive({ message, client });
      if (normalized && this.onMessage) {
        await this.onMessage(normalized);
      }
    });

    // ── Slash commands ────────────────────────────────────────────────

    this.app.command('/rawclaw', async ({ command, ack, respond }) => {
      await ack();
      if (this.onSlashCommand) {
        const result = await this.onSlashCommand('rawclaw', command.text, {
          channelId: command.channel_id,
          userId: command.user_id,
          userName: command.user_name,
          respond,
        });
        await respond(result);
      } else {
        await respond('Raw Claw slash command handler not configured.');
      }
    });

    this.app.command('/agent', async ({ command, ack, respond }) => {
      await ack();
      if (this.onSlashCommand) {
        const result = await this.onSlashCommand('agent', command.text, {
          channelId: command.channel_id,
          userId: command.user_id,
          userName: command.user_name,
          respond,
        });
        await respond(result);
      } else {
        await respond('Agent command handler not configured.');
      }
    });

    this.app.command('/status', async ({ command, ack, respond }) => {
      await ack();
      if (this.onSlashCommand) {
        const result = await this.onSlashCommand('status', command.text, {
          channelId: command.channel_id,
          userId: command.user_id,
          userName: command.user_name,
          respond,
        });
        await respond(result);
      } else {
        await respond('Status command handler not configured.');
      }
    });

    return { ok: true, message: 'Slack adapter initialized' };
  }

  /**
   * Start the Slack bot (socket mode or HTTP server).
   */
  async start(): Promise<void> {
    if (!this.app) throw new Error('SlackAdapter not initialized');
    await this.app.start();
    logger.info('Slack bot connected');
  }

  async shutdown(): Promise<void> {
    if (this.app) {
      await this.app.stop();
      this.app = null;
    }
  }

  async receive(event: unknown): Promise<IncomingMessage | null> {
    const { message, client } = event as { message: SlackMessageArgs['message']; client: SlackWebClient };

    if (!message.text && (!message.files || message.files.length === 0)) return null;

    const text = message.text || '';
    const userId = message.user || '';
    const threadTs = message.thread_ts || message.ts;

    // Track thread for this user (for reply threading)
    if (userId) {
      userThreads.set(userId, threadTs);
    }

    return {
      threadId: message.channel,
      text,
      attachments: [], // Files would need to be downloaded via Slack API
      metadata: {
        ts: message.ts,
        threadTs,
        channelId: message.channel,
        userId,
        client,
      },
      userName: userId, // Could be resolved to display name via users.info
      userId,
    };
  }

  async acknowledge(metadata: Record<string, unknown>): Promise<void> {
    const client = metadata.client as SlackWebClient | undefined;
    const channelId = metadata.channelId as string;
    const ts = metadata.ts as string;

    if (!client || !channelId || !ts) return;

    try {
      await client.reactions.add({ channel: channelId, timestamp: ts, name: 'eyes' });
    } catch {
      // Best effort — may fail if already reacted
    }
  }

  startTypingIndicator(_metadata: Record<string, unknown>): () => void {
    // Slack doesn't have a proper typing indicator API for bots.
    // The best we can do is nothing — Slack users expect async responses.
    return () => {};
  }

  async sendResponse(
    threadId: string,
    text: string,
    metadata: Record<string, unknown>,
    _options?: SendOptions,
  ): Promise<void> {
    const client = (metadata.client || this.app?.client) as SlackWebClient | undefined;
    if (!client) {
      logger.warn('Slack sendResponse: no client available');
      return;
    }

    const channelId = (metadata.channelId as string) || threadId;
    const threadTs = metadata.threadTs as string | undefined;

    if (!text) return;

    // Slack uses mrkdwn (its own markdown variant), which is close to standard markdown.
    // No conversion needed — Claude's markdown output works well in Slack.
    const parts = smartSplit(text, MAX_MESSAGE_LENGTH);

    for (const part of parts) {
      try {
        await client.chat.postMessage({
          channel: channelId,
          text: part,
          thread_ts: threadTs, // Reply in thread if we have one
          mrkdwn: true,
        });
      } catch (err) {
        logger.error({ err, channelId }, 'Failed to send Slack message');
      }
    }
  }

  /**
   * Send a structured block message to Slack.
   * Used for richer formatting (status cards, task lists, etc.).
   */
  async sendBlocks(
    channelId: string,
    blocks: unknown[],
    threadTs?: string,
  ): Promise<void> {
    const client = this.app?.client;
    if (!client) return;

    try {
      await client.chat.postMessage({
        channel: channelId,
        blocks,
        thread_ts: threadTs,
      });
    } catch (err) {
      logger.error({ err }, 'Failed to send Slack blocks');
    }
  }

  /**
   * Get the thread_ts for a user's most recent conversation.
   * Used for session continuity.
   */
  getThreadForUser(userId: string): string | undefined {
    return userThreads.get(userId);
  }
}
