/**
 * Telegram Channel Adapter for Raw Claw v3
 *
 * Wraps the grammy bot framework into the ChannelAdapter contract.
 * Handles: text, voice/audio (transcribed), photos, documents, videos.
 * Smart message splitting at 4096 chars, markdown-to-HTML conversion,
 * typing indicator that re-sends every 4s.
 */

import fs from 'fs';
import { Api, Bot, Context, InputFile, RawApi } from 'grammy';

import {
  ChannelAdapter,
  IncomingMessage,
  SendOptions,
  AdapterInitResult,
  smartSplit,
  markdownToTelegramHtml,
} from './base.js';
import { readEnvFile } from '../env.js';
import { logger } from '../logger.js';

// ── Constants ───────────────────────────────────────────────────────

const MAX_MESSAGE_LENGTH = 4096;
const TYPING_REFRESH_MS = 4000;

// ── Configuration ───────────────────────────────────────────────────

const envConfig = readEnvFile([
  'TELEGRAM_BOT_TOKEN',
  'ALLOWED_CHAT_ID',
]);

const TELEGRAM_BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN || envConfig.TELEGRAM_BOT_TOKEN || '';
const ALLOWED_CHAT_ID =
  process.env.ALLOWED_CHAT_ID || envConfig.ALLOWED_CHAT_ID || '';

// ── Adapter ─────────────────────────────────────────────────────────

export class TelegramAdapter extends ChannelAdapter {
  private bot: Bot | null = null;
  private botToken: string;
  private allowedChatId: string;

  /**
   * Callback invoked when a normalized message arrives.
   * Set by the orchestration layer (index.ts) before init().
   */
  onMessage: ((msg: IncomingMessage) => Promise<void>) | null = null;

  constructor(botToken?: string, allowedChatId?: string) {
    super();
    this.botToken = botToken || TELEGRAM_BOT_TOKEN;
    this.allowedChatId = allowedChatId || ALLOWED_CHAT_ID;
  }

  get channelName(): string {
    return 'Telegram';
  }

  get supportsStreaming(): boolean {
    return false;
  }

  get enabled(): boolean {
    return !!this.botToken;
  }

  /**
   * Get the underlying grammy Bot instance.
   * Needed for the dashboard (startDashboard uses bot.api) and scheduler.
   */
  getBot(): Bot | null {
    return this.bot;
  }

  /**
   * Get the bot API for direct message sending (used by scheduler, dashboard).
   */
  getApi(): Api<RawApi> | null {
    return this.bot?.api ?? null;
  }

  /**
   * Override the bot token (for multi-agent support).
   */
  setBotToken(token: string): void {
    this.botToken = token;
  }

  /**
   * Override the allowed chat ID.
   */
  setAllowedChatId(chatId: string): void {
    this.allowedChatId = chatId;
  }

  async init(): Promise<AdapterInitResult> {
    if (!this.botToken) {
      return { ok: false, message: 'TELEGRAM_BOT_TOKEN not set' };
    }

    this.bot = new Bot(this.botToken);

    // Register a catch-all message handler that normalizes and forwards
    this.bot.on('message', async (ctx) => {
      const msg = await this.receive(ctx);
      if (msg && this.onMessage) {
        await this.onMessage(msg);
      }
    });

    return { ok: true, message: 'Telegram adapter initialized' };
  }

  /**
   * Start polling for messages. Call after init().
   * Returns the bot info on successful connection.
   */
  async start(): Promise<{ username: string; firstName: string }> {
    if (!this.bot) throw new Error('TelegramAdapter not initialized');

    return new Promise((resolve) => {
      this.bot!.start({
        onStart: (botInfo) => {
          logger.info({ username: botInfo.username }, 'Telegram bot connected');
          resolve({
            username: botInfo.username ?? '',
            firstName: botInfo.first_name ?? 'RawClaw',
          });
        },
      });
    });
  }

  async shutdown(): Promise<void> {
    if (this.bot) {
      await this.bot.stop();
      this.bot = null;
    }
  }

  /**
   * Normalize a grammy Context into an IncomingMessage.
   * Handles text, voice, audio, photo, document, video, video_note.
   */
  async receive(event: unknown): Promise<IncomingMessage | null> {
    const ctx = event as Context;
    const message = ctx.message;
    if (!message || !message.chat) return null;

    const chatId = message.chat.id.toString();

    // Auth: first-run setup guidance if ALLOWED_CHAT_ID not set
    if (!this.allowedChatId) {
      await ctx.reply(
        `Your chat ID is ${chatId}.\n\nAdd this to your .env:\n\nALLOWED_CHAT_ID=${chatId}\n\nThen restart RawClaw.`,
      );
      return null;
    }

    // Auth: only accept messages from configured chat
    if (chatId !== this.allowedChatId) {
      logger.warn({ chatId }, 'Rejected message from unauthorized Telegram chat');
      return null;
    }

    let text = message.text || message.caption || '';
    const attachments: IncomingMessage['attachments'] = [];
    const userName = message.from?.first_name || message.from?.username || 'User';
    const userId = message.from?.id?.toString();

    // Voice messages -> placeholder (transcription happens in the message handler)
    if (message.voice) {
      // Return raw metadata; the orchestrator handles transcription
      return {
        threadId: chatId,
        text,
        attachments: [],
        metadata: {
          messageId: message.message_id,
          chatId: message.chat.id,
          ctx, // Pass grammy context for voice download
          isVoice: true,
          voiceFileId: message.voice.file_id,
        },
        userName,
        userId,
      };
    }

    // Audio messages -> same treatment as voice
    if (message.audio && !text) {
      return {
        threadId: chatId,
        text,
        attachments: [],
        metadata: {
          messageId: message.message_id,
          chatId: message.chat.id,
          ctx,
          isAudio: true,
          audioFileId: message.audio.file_id,
        },
        userName,
        userId,
      };
    }

    // Photo -> pass file_id for download
    if (message.photo && message.photo.length > 0) {
      const largest = message.photo[message.photo.length - 1];
      return {
        threadId: chatId,
        text: text || '',
        attachments: [],
        metadata: {
          messageId: message.message_id,
          chatId: message.chat.id,
          ctx,
          isPhoto: true,
          photoFileId: largest.file_id,
        },
        userName,
        userId,
      };
    }

    // Document -> pass file_id for download
    if (message.document) {
      return {
        threadId: chatId,
        text: text || '',
        attachments: [],
        metadata: {
          messageId: message.message_id,
          chatId: message.chat.id,
          ctx,
          isDocument: true,
          documentFileId: message.document.file_id,
          documentMimeType: message.document.mime_type,
          documentFileName: message.document.file_name,
        },
        userName,
        userId,
      };
    }

    // Video / Video note -> pass file_id
    if (message.video || message.video_note) {
      const fileId = message.video?.file_id || message.video_note?.file_id;
      return {
        threadId: chatId,
        text: text || '',
        attachments: [],
        metadata: {
          messageId: message.message_id,
          chatId: message.chat.id,
          ctx,
          isVideo: true,
          videoFileId: fileId,
        },
        userName,
        userId,
      };
    }

    // Plain text
    if (!text) return null;

    return {
      threadId: chatId,
      text,
      attachments,
      metadata: {
        messageId: message.message_id,
        chatId: message.chat.id,
        ctx,
      },
      userName,
      userId,
    };
  }

  async acknowledge(metadata: Record<string, unknown>): Promise<void> {
    const ctx = metadata.ctx as Context | undefined;
    if (!ctx) return;

    try {
      // React with thumbs up
      await ctx.api.setMessageReaction(
        metadata.chatId as number,
        metadata.messageId as number,
        [{ type: 'emoji', emoji: '\uD83D\uDC4D' }],
      );
    } catch {
      // Best effort — reaction API may not be available
    }
  }

  startTypingIndicator(metadata: Record<string, unknown>): () => void {
    const chatId = metadata.chatId as number;
    if (!chatId || !this.bot) return () => {};

    const api = this.bot.api;

    // Send immediately, then refresh every 4s
    void api.sendChatAction(chatId, 'typing').catch(() => {});

    const interval = setInterval(() => {
      void api.sendChatAction(chatId, 'typing').catch(() => {});
    }, TYPING_REFRESH_MS);

    return () => clearInterval(interval);
  }

  async sendResponse(
    threadId: string,
    text: string,
    metadata: Record<string, unknown>,
    options?: SendOptions,
  ): Promise<void> {
    if (!this.bot) return;

    const chatId = parseInt(threadId, 10);
    if (isNaN(chatId)) return;

    const api = this.bot.api;

    // Send file attachments first
    if (options?.files) {
      for (const file of options.files) {
        try {
          if (!fs.existsSync(file.filePath)) {
            await api.sendMessage(chatId, `Could not send file: ${file.filePath} (not found)`);
            continue;
          }
          const input = new InputFile(file.filePath);
          if (file.type === 'photo') {
            await api.sendPhoto(chatId, input, file.caption ? { caption: file.caption } : undefined);
          } else {
            await api.sendDocument(chatId, input, file.caption ? { caption: file.caption } : undefined);
          }
        } catch (err) {
          logger.error({ err, filePath: file.filePath }, 'Failed to send file via Telegram');
          await api.sendMessage(chatId, `Failed to send file: ${file.filePath}`);
        }
      }
    }

    // Format text
    if (!text) return;

    const parseMode = options?.parseMode ?? 'html';
    let formattedText: string;

    if (parseMode === 'html') {
      formattedText = markdownToTelegramHtml(text);
    } else if (parseMode === 'markdown') {
      formattedText = markdownToTelegramHtml(text);
    } else {
      formattedText = text;
    }

    // Split and send
    const parts = smartSplit(formattedText, MAX_MESSAGE_LENGTH);
    for (const part of parts) {
      try {
        await api.sendMessage(chatId, part, {
          parse_mode: parseMode === 'plain' ? undefined : 'HTML',
        });
      } catch (err) {
        // If HTML parsing fails, fall back to plain text
        logger.warn({ err }, 'Telegram HTML send failed, retrying as plain text');
        try {
          await api.sendMessage(chatId, text.slice(0, MAX_MESSAGE_LENGTH));
        } catch (fallbackErr) {
          logger.error({ err: fallbackErr }, 'Telegram plain text send also failed');
        }
      }
    }
  }

  /**
   * Send a raw text message to a chat ID (used by scheduler, health alerts).
   * Bypasses formatting for pre-formatted messages.
   */
  async sendRaw(chatId: string | number, text: string, parseMode?: 'HTML'): Promise<void> {
    if (!this.bot) return;
    const numericId = typeof chatId === 'string' ? parseInt(chatId, 10) : chatId;

    const parts = smartSplit(text, MAX_MESSAGE_LENGTH);
    for (const part of parts) {
      try {
        await this.bot.api.sendMessage(numericId, part, parseMode ? { parse_mode: parseMode } : undefined);
      } catch (err) {
        logger.error({ err, chatId }, 'Failed to send raw Telegram message');
      }
    }
  }

  /**
   * Send a voice note response.
   */
  async sendVoice(chatId: string | number, audioBuffer: Buffer): Promise<void> {
    if (!this.bot) return;
    const numericId = typeof chatId === 'string' ? parseInt(chatId, 10) : chatId;

    try {
      await this.bot.api.sendVoice(numericId, new InputFile(audioBuffer, 'response.ogg'));
    } catch (err) {
      logger.error({ err }, 'Failed to send voice via Telegram');
    }
  }

  /**
   * Edit a previously sent message (for streaming updates).
   */
  async editMessage(chatId: number, messageId: number, text: string): Promise<void> {
    if (!this.bot) return;
    try {
      await this.bot.api.editMessageText(chatId, messageId, text);
    } catch {
      // Best effort — message may have been deleted
    }
  }

  /**
   * Delete a message (for cleaning up streaming placeholders).
   */
  async deleteMessage(chatId: number, messageId: number): Promise<void> {
    if (!this.bot) return;
    try {
      await this.bot.api.deleteMessage(chatId, messageId);
    } catch {
      // Best effort
    }
  }
}
