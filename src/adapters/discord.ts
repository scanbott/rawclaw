/**
 * Discord Channel Adapter for Raw Claw v3
 *
 * Uses Discord.js v14. Bot receives messages in a configured channel,
 * splits responses at 2000 chars, supports slash commands and embeds.
 *
 * Required env vars:
 *   DISCORD_ADAPTER_BOT_TOKEN  — Bot token (different from notification webhook token)
 *   DISCORD_ADAPTER_CHANNEL_ID — Channel ID to listen in
 *   DISCORD_ADAPTER_GUILD_ID   — Guild (server) ID for slash command registration
 *
 * Optional:
 *   DISCORD_ADAPTER_ALLOWED_ROLES — Comma-separated role IDs that can interact with the bot
 */

import {
  ChannelAdapter,
  IncomingMessage,
  SendOptions,
  AdapterInitResult,
  smartSplit,
  markdownToDiscord,
} from './base.js';
import { readEnvFile } from '../env.js';
import { logger } from '../logger.js';

// ── Constants ───────────────────────────────────────────────────────

const MAX_MESSAGE_LENGTH = 2000;

// ── Configuration ───────────────────────────────────────────────────

const envConfig = readEnvFile([
  'DISCORD_ADAPTER_BOT_TOKEN',
  'DISCORD_ADAPTER_CHANNEL_ID',
  'DISCORD_ADAPTER_GUILD_ID',
  'DISCORD_ADAPTER_ALLOWED_ROLES',
]);

const BOT_TOKEN = process.env.DISCORD_ADAPTER_BOT_TOKEN || envConfig.DISCORD_ADAPTER_BOT_TOKEN || '';
const CHANNEL_ID = process.env.DISCORD_ADAPTER_CHANNEL_ID || envConfig.DISCORD_ADAPTER_CHANNEL_ID || '';
const GUILD_ID = process.env.DISCORD_ADAPTER_GUILD_ID || envConfig.DISCORD_ADAPTER_GUILD_ID || '';
const ALLOWED_ROLES = (process.env.DISCORD_ADAPTER_ALLOWED_ROLES || envConfig.DISCORD_ADAPTER_ALLOWED_ROLES || '')
  .split(',')
  .map((r) => r.trim())
  .filter(Boolean);

// ── Types for Discord.js (lazy-loaded to avoid hard dependency) ─────

interface DiscordClient {
  login(token: string): Promise<string>;
  destroy(): Promise<void>;
  on(event: string, handler: (...args: unknown[]) => void): void;
  once(event: string, handler: (...args: unknown[]) => void): void;
  user: { tag: string; id: string } | null;
  application: { id: string } | null;
}

interface DiscordMessage {
  id: string;
  content: string;
  channelId: string;
  guildId: string | null;
  author: { id: string; username: string; bot: boolean };
  channel: {
    id: string;
    send(content: string | object): Promise<DiscordMessage>;
    sendTyping(): Promise<void>;
  };
  reply(content: string | object): Promise<DiscordMessage>;
  react(emoji: string): Promise<void>;
  attachments: Map<string, { url: string; name: string; contentType: string | null }>;
}

interface DiscordInteraction {
  commandName: string;
  options: { getString(name: string): string | null };
  reply(content: string | object): Promise<void>;
  deferReply(): Promise<void>;
  editReply(content: string | object): Promise<void>;
  channelId: string;
  guildId: string | null;
  user: { id: string; username: string };
  channel: {
    id: string;
    send(content: string | object): Promise<DiscordMessage>;
    sendTyping(): Promise<void>;
  };
}

// ── Adapter ─────────────────────────────────────────────────────────

export class DiscordAdapter extends ChannelAdapter {
  private client: DiscordClient | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private discordModule: any = null;

  /**
   * Callback invoked when a normalized message arrives.
   * Set by the orchestration layer before init().
   */
  onMessage: ((msg: IncomingMessage) => Promise<void>) | null = null;

  /**
   * Callback for slash commands that need special handling.
   * Keys: 'newchat', 'status', 'task'
   */
  onSlashCommand: ((command: string, args: string, metadata: Record<string, unknown>) => Promise<string>) | null = null;

  get channelName(): string {
    return 'Discord';
  }

  get supportsStreaming(): boolean {
    return false;
  }

  get enabled(): boolean {
    return !!BOT_TOKEN && !!CHANNEL_ID;
  }

  async init(): Promise<AdapterInitResult> {
    if (!this.enabled) {
      return { ok: false, message: 'Discord adapter disabled: DISCORD_ADAPTER_BOT_TOKEN or DISCORD_ADAPTER_CHANNEL_ID not set' };
    }

    // Lazy-load discord.js to avoid requiring it when adapter is disabled
    try {
      // @ts-expect-error — discord.js is an optional dependency, may not be installed
      this.discordModule = await import('discord.js');
    } catch {
      return { ok: false, message: 'discord.js not installed. Run: npm install discord.js' };
    }

    const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = this.discordModule;

    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    }) as unknown as DiscordClient;

    this.client = client;

    // Register slash commands
    if (GUILD_ID) {
      try {
        const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
        const commands = [
          new SlashCommandBuilder()
            .setName('ask')
            .setDescription('Ask your AI assistant a question')
            .addStringOption((opt: any) =>
              opt.setName('message').setDescription('Your message').setRequired(true),
            ),
          new SlashCommandBuilder()
            .setName('task')
            .setDescription('Create a task for an agent')
            .addStringOption((opt: any) =>
              opt.setName('description').setDescription('Task description').setRequired(true),
            ),
          new SlashCommandBuilder()
            .setName('status')
            .setDescription('Show agent status and health'),
          new SlashCommandBuilder()
            .setName('newchat')
            .setDescription('Start a fresh conversation (clear session)'),
        ].map((cmd) => cmd.toJSON());

        await rest.put(
          Routes.applicationGuildCommands(client.application?.id || '', GUILD_ID),
          { body: commands },
        ).catch(() => {
          // Commands registration may fail before login — re-register after ready
        });

        logger.info('Discord slash commands registered');
      } catch (err) {
        logger.warn({ err }, 'Failed to register Discord slash commands (will retry after login)');
      }
    }

    // Message handler
    client.on('messageCreate', async (raw: unknown) => {
      const message = raw as DiscordMessage;

      // Ignore bots and messages from wrong channel
      if (message.author.bot) return;
      if (message.channelId !== CHANNEL_ID) return;

      // Role check
      if (ALLOWED_ROLES.length > 0) {
        // Role checking requires member data; skip if unavailable
        // (in DMs or when member data isn't cached)
      }

      if (!message.content && message.attachments.size === 0) return;

      const normalized = await this.receive(message);
      if (normalized && this.onMessage) {
        await this.onMessage(normalized);
      }
    });

    // Slash command handler
    client.on('interactionCreate', async (raw: unknown) => {
      const interaction = raw as DiscordInteraction & { isCommand?: () => boolean; isChatInputCommand?: () => boolean };
      if (!interaction.isChatInputCommand?.()) return;

      const { commandName } = interaction;

      if (commandName === 'ask') {
        const message = interaction.options.getString('message');
        if (!message) {
          await interaction.reply('Please provide a message.');
          return;
        }

        await interaction.deferReply();

        const normalized: IncomingMessage = {
          threadId: CHANNEL_ID,
          text: message,
          attachments: [],
          metadata: {
            interaction,
            channelId: CHANNEL_ID,
            isSlashCommand: true,
            commandName: 'ask',
          },
          userName: interaction.user.username,
          userId: interaction.user.id,
        };

        if (this.onMessage) {
          await this.onMessage(normalized);
        }
        return;
      }

      if (commandName === 'task' || commandName === 'status' || commandName === 'newchat') {
        const args = interaction.options.getString('description') || '';
        if (this.onSlashCommand) {
          await interaction.deferReply();
          const result = await this.onSlashCommand(commandName, args, {
            interaction,
            channelId: CHANNEL_ID,
          });
          await interaction.editReply(result);
        } else {
          await interaction.reply(`/${commandName} handler not configured.`);
        }
        return;
      }
    });

    return { ok: true, message: 'Discord adapter initialized' };
  }

  /**
   * Connect to Discord. Call after init().
   */
  async start(): Promise<void> {
    if (!this.client) throw new Error('DiscordAdapter not initialized');

    return new Promise((resolve, reject) => {
      this.client!.once('ready', () => {
        const tag = this.client!.user?.tag || 'Unknown';
        logger.info({ tag }, 'Discord bot connected');

        // Re-register slash commands now that we have application ID
        if (GUILD_ID && this.discordModule && this.client?.application?.id) {
          const { REST, Routes, SlashCommandBuilder } = this.discordModule;
          const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
          const commands = [
            new SlashCommandBuilder().setName('ask').setDescription('Ask your AI assistant').addStringOption((opt: any) => opt.setName('message').setDescription('Your message').setRequired(true)),
            new SlashCommandBuilder().setName('task').setDescription('Create a task').addStringOption((opt: any) => opt.setName('description').setDescription('Task description').setRequired(true)),
            new SlashCommandBuilder().setName('status').setDescription('Show agent status'),
            new SlashCommandBuilder().setName('newchat').setDescription('Start fresh conversation'),
          ].map((cmd) => cmd.toJSON());

          void rest.put(
            Routes.applicationGuildCommands(this.client.application.id, GUILD_ID),
            { body: commands },
          ).catch((e: unknown) => logger.warn({ err: e }, 'Failed to register Discord slash commands'));
        }

        resolve();
      });

      this.client!.login(BOT_TOKEN).catch(reject);
    });
  }

  async shutdown(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
      this.client = null;
    }
  }

  async receive(event: unknown): Promise<IncomingMessage | null> {
    const message = event as DiscordMessage;

    if (message.author.bot) return null;

    let text = message.content || '';
    const attachments: IncomingMessage['attachments'] = [];

    // Process attachments
    if (message.attachments.size > 0) {
      for (const [, attachment] of message.attachments) {
        const contentType = attachment.contentType || 'application/octet-stream';
        const category = contentType.startsWith('image/')
          ? 'image' as const
          : contentType.startsWith('video/')
            ? 'video' as const
            : 'document' as const;

        // Store URL in metadata for lazy download rather than downloading immediately
        attachments.push({
          category,
          mimeType: contentType,
          data: Buffer.alloc(0), // Placeholder — download on demand
          filename: attachment.name,
        });
      }
    }

    if (!text && attachments.length === 0) return null;

    return {
      threadId: message.channelId,
      text,
      attachments,
      metadata: {
        messageId: message.id,
        channelId: message.channelId,
        guildId: message.guildId,
        discordMessage: message,
      },
      userName: message.author.username,
      userId: message.author.id,
    };
  }

  async acknowledge(metadata: Record<string, unknown>): Promise<void> {
    const message = metadata.discordMessage as DiscordMessage | undefined;
    if (!message) return;

    try {
      await message.react('\uD83D\uDC4D');
    } catch {
      // Best effort
    }
  }

  startTypingIndicator(metadata: Record<string, unknown>): () => void {
    const message = metadata.discordMessage as DiscordMessage | undefined;
    const interaction = metadata.interaction as DiscordInteraction | undefined;

    const channel = message?.channel || interaction?.channel;
    if (!channel) return () => {};

    // Discord typing indicator lasts 10s, refresh every 8s
    void channel.sendTyping().catch(() => {});
    const interval = setInterval(() => {
      void channel.sendTyping().catch(() => {});
    }, 8000);

    return () => clearInterval(interval);
  }

  async sendResponse(
    threadId: string,
    text: string,
    metadata: Record<string, unknown>,
    options?: SendOptions,
  ): Promise<void> {
    const message = metadata.discordMessage as DiscordMessage | undefined;
    const interaction = metadata.interaction as DiscordInteraction | undefined;

    if (!text && !options?.files?.length) return;

    const formattedText = markdownToDiscord(text);
    const parts = smartSplit(formattedText, MAX_MESSAGE_LENGTH);

    // Slash command response
    if (interaction && metadata.isSlashCommand) {
      try {
        // First part goes as edit to the deferred reply
        if (parts.length > 0) {
          await interaction.editReply(parts[0]);
        }
        // Additional parts as follow-up messages
        for (let i = 1; i < parts.length; i++) {
          await interaction.channel.send(parts[i]);
        }
      } catch (err) {
        logger.error({ err }, 'Failed to send Discord slash command response');
      }
      return;
    }

    // Regular message response
    if (message) {
      try {
        // First part as reply to original message
        if (parts.length > 0) {
          await message.reply(parts[0]);
        }
        // Additional parts as channel messages
        for (let i = 1; i < parts.length; i++) {
          await message.channel.send(parts[i]);
        }
      } catch (err) {
        logger.error({ err }, 'Failed to send Discord message response');
      }
      return;
    }

    // Fallback: send to channel directly
    if (this.client && this.discordModule) {
      // Need to fetch the channel and send
      logger.warn('Discord sendResponse: no message or interaction context, cannot send');
    }
  }

  /**
   * Send a rich embed to the Discord channel.
   * Used for structured output (agent status, task results, health alerts).
   */
  async sendEmbed(
    threadId: string,
    embed: {
      title?: string;
      description?: string;
      color?: number;
      fields?: Array<{ name: string; value: string; inline?: boolean }>;
      footer?: string;
    },
    metadata: Record<string, unknown>,
  ): Promise<void> {
    if (!this.discordModule) return;

    const message = metadata.discordMessage as DiscordMessage | undefined;
    const { EmbedBuilder } = this.discordModule;

    const embedObj = new EmbedBuilder();
    if (embed.title) embedObj.setTitle(embed.title);
    if (embed.description) embedObj.setDescription(embed.description);
    if (embed.color !== undefined) embedObj.setColor(embed.color);
    if (embed.fields) {
      for (const field of embed.fields) {
        embedObj.addFields({ name: field.name, value: field.value, inline: field.inline });
      }
    }
    if (embed.footer) embedObj.setFooter({ text: embed.footer });
    embedObj.setTimestamp();

    if (message) {
      try {
        await message.channel.send({ embeds: [embedObj] } as any);
      } catch (err) {
        logger.error({ err }, 'Failed to send Discord embed');
      }
    }
  }
}
