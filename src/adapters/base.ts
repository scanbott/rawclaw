/**
 * Base Channel Adapter for Raw Claw v3
 *
 * Abstract contract that every chat channel (Telegram, Discord, Slack, Webhook)
 * implements. Inspired by ThePopeBot's channel adapter pattern.
 *
 * Each adapter normalizes channel-specific input into a standard IncomingMessage,
 * and accepts a standard string response to send back via the channel.
 */

// ── Shared Types ────────────────────────────────────────────────────

export interface MessageAttachment {
  /** What kind of content this is */
  category: 'image' | 'document' | 'audio' | 'video';
  /** MIME type of the attachment */
  mimeType: string;
  /** Raw file data */
  data: Buffer;
  /** Original filename, if available */
  filename?: string;
}

/**
 * Normalized incoming message from any channel.
 * Every adapter's receive() returns this shape.
 */
export interface IncomingMessage {
  /** Unique identifier for the conversation thread (chat ID, channel ID, etc.) */
  threadId: string;
  /** The user's text (may be transcribed from voice) */
  text: string;
  /** Non-text attachments (images, documents, videos) */
  attachments: MessageAttachment[];
  /** Channel-specific metadata needed for acknowledge/sendResponse */
  metadata: Record<string, unknown>;
  /** Display name of the user who sent the message */
  userName?: string;
  /** Unique user ID within the channel */
  userId?: string;
}

/**
 * Options passed to sendResponse for richer output control.
 */
export interface SendOptions {
  /** Parse mode for text formatting (adapter translates to channel-specific format) */
  parseMode?: 'html' | 'markdown' | 'plain';
  /** Whether to send as a reply to the original message */
  replyToMessage?: boolean;
  /** File attachments to send alongside the text */
  files?: Array<{
    type: 'document' | 'photo';
    filePath: string;
    caption?: string;
  }>;
}

/**
 * Result from adapter initialization.
 */
export interface AdapterInitResult {
  /** Whether the adapter started successfully */
  ok: boolean;
  /** Human-readable status message */
  message: string;
}

// ── Abstract Base Class ─────────────────────────────────────────────

export abstract class ChannelAdapter {
  /**
   * Initialize the adapter (connect to API, set up webhooks, etc.).
   * Called once at startup. Must be idempotent.
   */
  abstract init(): Promise<AdapterInitResult>;

  /**
   * Gracefully shut down the adapter (disconnect, clean up resources).
   */
  abstract shutdown(): Promise<void>;

  /**
   * Handle an incoming event from this channel.
   * Returns a normalized IncomingMessage or null if the event should be ignored
   * (e.g., bot's own messages, unauthorized users, non-message events).
   *
   * For webhook-based channels (Telegram, Slack), this parses the webhook payload.
   * For gateway-based channels (Discord.js), this is called from the event handler.
   */
  abstract receive(event: unknown): Promise<IncomingMessage | null>;

  /**
   * Show the user that their message was received.
   * Telegram: thumbs up reaction. Discord: reaction emoji. Slack: emoji. Webhook: no-op.
   */
  abstract acknowledge(metadata: Record<string, unknown>): Promise<void>;

  /**
   * Show a "typing" or "processing" indicator to the user.
   * Returns a stop function that cancels the indicator.
   *
   * The indicator auto-refreshes internally (e.g., Telegram typing expires after 5s,
   * so the adapter re-sends every 4s).
   */
  abstract startTypingIndicator(metadata: Record<string, unknown>): () => void;

  /**
   * Send a complete text response back to the channel.
   * Handles message splitting (Telegram 4096, Discord 2000, Slack 4000).
   */
  abstract sendResponse(
    threadId: string,
    text: string,
    metadata: Record<string, unknown>,
    options?: SendOptions,
  ): Promise<void>;

  /**
   * Whether this channel supports real-time streaming (SSE, WebSocket).
   * If true, the agent layer can provide incremental text updates.
   */
  abstract get supportsStreaming(): boolean;

  /**
   * Human-readable name of this channel (e.g., "Telegram", "Discord", "Slack").
   */
  abstract get channelName(): string;

  /**
   * Whether this adapter is enabled (has required env vars configured).
   */
  abstract get enabled(): boolean;
}

// ── Shared Utilities ────────────────────────────────────────────────

/**
 * Smart message splitting that respects a character limit.
 * Splits at paragraph breaks > newlines > sentence endings > spaces.
 *
 * Ported from ThePopeBot's smartSplit pattern.
 */
export function smartSplit(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) return [text];

  const parts: string[] = [];
  let remaining = text;

  while (remaining.length > maxLength) {
    const chunk = remaining.slice(0, maxLength);

    // Try split points in order of preference
    let splitAt = -1;

    // 1. Double newline (paragraph break)
    const lastParagraph = chunk.lastIndexOf('\n\n');
    if (lastParagraph > maxLength * 0.3) {
      splitAt = lastParagraph;
    }

    // 2. Single newline
    if (splitAt === -1) {
      const lastNewline = chunk.lastIndexOf('\n');
      if (lastNewline > maxLength * 0.3) {
        splitAt = lastNewline;
      }
    }

    // 3. Sentence ending (. ! ?)
    if (splitAt === -1) {
      const sentenceEnd = Math.max(
        chunk.lastIndexOf('. '),
        chunk.lastIndexOf('! '),
        chunk.lastIndexOf('? '),
      );
      if (sentenceEnd > maxLength * 0.3) {
        splitAt = sentenceEnd + 1; // Include the punctuation
      }
    }

    // 4. Space
    if (splitAt === -1) {
      const lastSpace = chunk.lastIndexOf(' ');
      if (lastSpace > maxLength * 0.3) {
        splitAt = lastSpace;
      }
    }

    // 5. Hard cut (last resort)
    if (splitAt === -1) {
      splitAt = maxLength;
    }

    parts.push(remaining.slice(0, splitAt).trimEnd());
    remaining = remaining.slice(splitAt).trimStart();
  }

  if (remaining) parts.push(remaining);
  return parts;
}

/**
 * Escape HTML entities for safe embedding in HTML messages.
 */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Convert Markdown to Telegram HTML.
 * Telegram supports: <b>, <i>, <s>, <u>, <code>, <pre>, <a>.
 */
export function markdownToTelegramHtml(text: string): string {
  // 1. Extract and protect code blocks
  const codeBlocks: string[] = [];
  let result = text.replace(/```(?:\w*\n)?([\s\S]*?)```/g, (_, code) => {
    const escaped = code.trim()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    codeBlocks.push(`<pre>${escaped}</pre>`);
    return `\x00CODE${codeBlocks.length - 1}\x00`;
  });

  // 2. Escape HTML entities
  result = result
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 3. Inline code
  const inlineCodes: string[] = [];
  result = result.replace(/`([^`]+)`/g, (_, code) => {
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    inlineCodes.push(`<code>${escaped}</code>`);
    return `\x00INLINE${inlineCodes.length - 1}\x00`;
  });

  // 4. Headings -> bold
  result = result.replace(/^#{1,6}\s+(.+)$/gm, '<b>$1</b>');

  // 5. Horizontal rules -> remove
  result = result.replace(/\n*^[-*_]{3,}$\n*/gm, '\n');

  // 6. Checkboxes
  result = result.replace(/^(\s*)-\s+\[x\]\s*/gim, '$1\u2713 ');
  result = result.replace(/^(\s*)-\s+\[\s\]\s*/gm, '$1\u2610 ');

  // 7. Bold
  result = result.replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>');
  result = result.replace(/__([^_\n]+)__/g, '<b>$1</b>');

  // 8. Italic
  result = result.replace(/\*([^*\n]+)\*/g, '<i>$1</i>');
  result = result.replace(/(?<!\w)_([^_\n]+)_(?!\w)/g, '<i>$1</i>');

  // 9. Strikethrough
  result = result.replace(/~~([^~\n]+)~~/g, '<s>$1</s>');

  // 10. Links
  result = result.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2">$1</a>');

  // 11. Restore code blocks
  result = result.replace(/\x00CODE(\d+)\x00/g, (_, i) => codeBlocks[parseInt(i)]);
  result = result.replace(/\x00INLINE(\d+)\x00/g, (_, i) => inlineCodes[parseInt(i)]);

  // 12. Collapse excessive blank lines
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}

/**
 * Convert Markdown to Discord-compatible format.
 * Discord natively supports most Markdown, so this is mostly a passthrough
 * with minor adjustments.
 */
export function markdownToDiscord(text: string): string {
  // Discord supports: **bold**, *italic*, ~~strikethrough~~, `code`, ```code blocks```, [text](url)
  // No conversion needed for most markdown, but strip HTML if present
  let result = text;

  // Convert HTML bold/italic/code back to markdown if present
  result = result.replace(/<b>(.*?)<\/b>/g, '**$1**');
  result = result.replace(/<i>(.*?)<\/i>/g, '*$1*');
  result = result.replace(/<s>(.*?)<\/s>/g, '~~$1~~');
  result = result.replace(/<code>(.*?)<\/code>/g, '`$1`');
  result = result.replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)');

  return result;
}
