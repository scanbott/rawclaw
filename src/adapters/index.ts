/**
 * Adapter Registry for Raw Claw v3
 *
 * Central registry that manages all channel adapters.
 * Config-driven: .env specifies which adapters to enable.
 * Each adapter initializes independently — a failed adapter
 * doesn't block others from starting.
 *
 * Usage:
 *   const registry = new AdapterRegistry();
 *   registry.register('telegram', new TelegramAdapter());
 *   registry.register('discord', new DiscordAdapter());
 *   await registry.initAll();
 *   await registry.startAll();
 */

import { ChannelAdapter, IncomingMessage } from './base.js';
import { TelegramAdapter } from './telegram.js';
import { DiscordAdapter } from './discord.js';
import { SlackAdapter } from './slack.js';
import { WebhookAdapter } from './webhook.js';
import { readEnvFile } from '../env.js';
import { logger } from '../logger.js';

// Re-export everything from base for convenience
export * from './base.js';
export { TelegramAdapter } from './telegram.js';
export { DiscordAdapter } from './discord.js';
export { SlackAdapter } from './slack.js';
export { WebhookAdapter } from './webhook.js';

// ── Configuration ───────────────────────────────────────────────────

const envConfig = readEnvFile(['ENABLED_ADAPTERS']);

/**
 * Comma-separated list of adapters to enable.
 * Default: 'telegram' (backward compatible with v2).
 * Set to 'all' to enable everything that has valid config.
 * Example: ENABLED_ADAPTERS=telegram,discord,webhook
 */
const ENABLED_ADAPTERS = (
  process.env.ENABLED_ADAPTERS || envConfig.ENABLED_ADAPTERS || 'telegram'
)
  .split(',')
  .map((a) => a.trim().toLowerCase())
  .filter(Boolean);

const ENABLE_ALL = ENABLED_ADAPTERS.includes('all');

// ── Registry ────────────────────────────────────────────────────────

export interface AdapterStatus {
  name: string;
  channelName: string;
  enabled: boolean;
  initialized: boolean;
  running: boolean;
  error?: string;
}

export class AdapterRegistry {
  private adapters = new Map<string, ChannelAdapter>();
  private initialized = new Set<string>();
  private running = new Set<string>();
  private errors = new Map<string, string>();

  /**
   * Global message handler — called when ANY adapter receives a message.
   * The orchestration layer sets this before calling initAll().
   */
  onMessage: ((msg: IncomingMessage, adapterName: string) => Promise<void>) | null = null;

  /**
   * Register an adapter by name.
   */
  register(name: string, adapter: ChannelAdapter): void {
    this.adapters.set(name, adapter);
  }

  /**
   * Get a registered adapter by name.
   */
  get<T extends ChannelAdapter>(name: string): T | undefined {
    return this.adapters.get(name) as T | undefined;
  }

  /**
   * Get all registered adapters.
   */
  getAll(): Map<string, ChannelAdapter> {
    return this.adapters;
  }

  /**
   * Check if an adapter should be enabled based on config.
   */
  private shouldEnable(name: string): boolean {
    if (ENABLE_ALL) return true;
    return ENABLED_ADAPTERS.includes(name);
  }

  /**
   * Register all built-in adapters.
   * Call before initAll(). Adapters are registered but not yet initialized.
   */
  registerDefaults(): void {
    this.register('telegram', new TelegramAdapter());
    this.register('discord', new DiscordAdapter());
    this.register('slack', new SlackAdapter());
    this.register('webhook', new WebhookAdapter());
  }

  /**
   * Initialize all enabled adapters.
   * Failed adapters log warnings but don't block others.
   */
  async initAll(): Promise<void> {
    const initPromises: Promise<void>[] = [];

    for (const [name, adapter] of this.adapters) {
      if (!this.shouldEnable(name)) {
        logger.debug({ adapter: name }, 'Adapter not in ENABLED_ADAPTERS, skipping');
        continue;
      }

      if (!adapter.enabled) {
        logger.debug({ adapter: name }, 'Adapter missing required config, skipping');
        continue;
      }

      // Wire up the message handler
      this.wireMessageHandler(name, adapter);

      initPromises.push(
        adapter.init().then((result) => {
          if (result.ok) {
            this.initialized.add(name);
            logger.info({ adapter: name }, `${adapter.channelName} adapter initialized`);
          } else {
            this.errors.set(name, result.message);
            logger.warn({ adapter: name, reason: result.message }, `${adapter.channelName} adapter failed to initialize`);
          }
        }).catch((err) => {
          const errMsg = err instanceof Error ? err.message : String(err);
          this.errors.set(name, errMsg);
          logger.error({ adapter: name, err }, `${adapter.channelName} adapter init error`);
        }),
      );
    }

    await Promise.all(initPromises);

    const initCount = this.initialized.size;
    const totalEnabled = [...this.adapters.entries()].filter(([name]) => this.shouldEnable(name) && this.adapters.get(name)?.enabled).length;
    logger.info({ initialized: initCount, total: totalEnabled }, 'Adapter initialization complete');
  }

  /**
   * Start all initialized adapters (connect to APIs, start polling/websockets).
   * Each adapter starts independently.
   */
  async startAll(): Promise<void> {
    const startPromises: Promise<void>[] = [];

    for (const name of this.initialized) {
      const adapter = this.adapters.get(name);
      if (!adapter) continue;

      startPromises.push(
        this.startAdapter(name, adapter).then(() => {
          this.running.add(name);
        }).catch((err) => {
          const errMsg = err instanceof Error ? err.message : String(err);
          this.errors.set(name, errMsg);
          logger.error({ adapter: name, err }, `${adapter.channelName} adapter start error`);
        }),
      );
    }

    await Promise.all(startPromises);

    const runCount = this.running.size;
    logger.info({ running: runCount }, 'All adapters started');
  }

  /**
   * Start a single adapter, handling type-specific startup.
   */
  private async startAdapter(name: string, adapter: ChannelAdapter): Promise<void> {
    if (adapter instanceof TelegramAdapter) {
      const info = await adapter.start();
      logger.info({ username: info.username }, 'Telegram bot online');
      return;
    }

    if (adapter instanceof DiscordAdapter) {
      await adapter.start();
      return;
    }

    if (adapter instanceof SlackAdapter) {
      await adapter.start();
      return;
    }

    if (adapter instanceof WebhookAdapter) {
      await adapter.start();
      return;
    }

    // Generic start for custom adapters
    logger.info({ adapter: name }, `${adapter.channelName} adapter started`);
  }

  /**
   * Wire the onMessage callback for an adapter.
   */
  private wireMessageHandler(name: string, adapter: ChannelAdapter): void {
    const handler = async (msg: IncomingMessage) => {
      if (this.onMessage) {
        await this.onMessage(msg, name);
      }
    };

    if (adapter instanceof TelegramAdapter) {
      adapter.onMessage = handler;
    } else if (adapter instanceof DiscordAdapter) {
      adapter.onMessage = handler;
    } else if (adapter instanceof SlackAdapter) {
      adapter.onMessage = handler;
    } else if (adapter instanceof WebhookAdapter) {
      adapter.onMessage = handler;
    }
  }

  /**
   * Shut down all running adapters gracefully.
   */
  async shutdownAll(): Promise<void> {
    const shutdownPromises: Promise<void>[] = [];

    for (const name of this.running) {
      const adapter = this.adapters.get(name);
      if (!adapter) continue;

      shutdownPromises.push(
        adapter.shutdown().catch((err) => {
          logger.error({ adapter: name, err }, `${adapter.channelName} adapter shutdown error`);
        }),
      );
    }

    await Promise.all(shutdownPromises);
    this.running.clear();
    this.initialized.clear();
    logger.info('All adapters shut down');
  }

  /**
   * Get status of all registered adapters.
   */
  getStatus(): AdapterStatus[] {
    const statuses: AdapterStatus[] = [];

    for (const [name, adapter] of this.adapters) {
      statuses.push({
        name,
        channelName: adapter.channelName,
        enabled: adapter.enabled && this.shouldEnable(name),
        initialized: this.initialized.has(name),
        running: this.running.has(name),
        error: this.errors.get(name),
      });
    }

    return statuses;
  }

  /**
   * Check if any adapter is currently running.
   */
  hasRunningAdapters(): boolean {
    return this.running.size > 0;
  }

  /**
   * Get the names of all running adapters.
   */
  getRunningAdapterNames(): string[] {
    return [...this.running];
  }

  /**
   * Send a response to ALL running adapters that match a given thread.
   * Useful for broadcasting (e.g., scheduled task results to all channels).
   */
  async broadcastResponse(text: string, options?: { parseMode?: 'html' | 'markdown' | 'plain' }): Promise<void> {
    for (const name of this.running) {
      const adapter = this.adapters.get(name);
      if (!adapter) continue;

      try {
        // Each adapter needs its own thread ID / metadata for sending.
        // For broadcast, we skip adapters that don't have a default channel.
        if (adapter instanceof TelegramAdapter) {
          await adapter.sendRaw(
            readEnvFile(['ALLOWED_CHAT_ID']).ALLOWED_CHAT_ID || '',
            text,
            options?.parseMode === 'html' ? 'HTML' : undefined,
          );
        }
        // Discord and Slack adapters would need channel IDs configured
      } catch (err) {
        logger.warn({ adapter: name, err }, 'Broadcast failed for adapter');
      }
    }
  }
}

/**
 * Create and configure the default adapter registry.
 * Convenience function for index.ts.
 */
export function createAdapterRegistry(): AdapterRegistry {
  const registry = new AdapterRegistry();
  registry.registerDefaults();
  return registry;
}
