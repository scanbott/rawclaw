/**
 * Discord Adapter for Raw Claw v2
 *
 * Lightweight Discord integration following the same pattern as slack.ts.
 * Supports: DM conversations, channel messages, webhook posting.
 * Uses Discord REST API directly (no discord.js dependency).
 */

import { readEnvFile } from './env.js';
import { logger } from './logger.js';

// ── Configuration ───────────────────────────────────────────────────

const envConfig = readEnvFile([
  'DISCORD_BOT_TOKEN',
  'DISCORD_WEBHOOK_URL',
  'DISCORD_GUILD_ID',
]);

export const DISCORD_BOT_TOKEN =
  process.env.DISCORD_BOT_TOKEN || envConfig.DISCORD_BOT_TOKEN || '';
export const DISCORD_WEBHOOK_URL =
  process.env.DISCORD_WEBHOOK_URL || envConfig.DISCORD_WEBHOOK_URL || '';
export const DISCORD_GUILD_ID =
  process.env.DISCORD_GUILD_ID || envConfig.DISCORD_GUILD_ID || '';

export const discordEnabled = !!DISCORD_BOT_TOKEN;

const API_BASE = 'https://discord.com/api/v10';

// ── REST Client ─────────────────────────────────────────────────────

async function discordFetch(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<unknown> {
  const resp = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Discord API error ${resp.status}: ${text}`);
  }

  const contentType = resp.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return resp.json();
  }
  return null;
}

// ── Types ───────────────────────────────────────────────────────────

export interface DiscordChannel {
  id: string;
  name: string;
  type: number;
}

export interface DiscordMessage {
  id: string;
  channel_id: string;
  author: { id: string; username: string };
  content: string;
  timestamp: string;
}

// ── Channel Operations ──────────────────────────────────────────────

/** List channels in the configured guild */
export async function listChannels(): Promise<DiscordChannel[]> {
  if (!discordEnabled || !DISCORD_GUILD_ID) return [];
  try {
    const channels = await discordFetch(`/guilds/${DISCORD_GUILD_ID}/channels`) as DiscordChannel[];
    return channels.filter((c) => c.type === 0); // Text channels only
  } catch (e) {
    logger.warn({ error: String(e) }, 'Failed to list Discord channels');
    return [];
  }
}

/** Read recent messages from a channel */
export async function readMessages(channelId: string, limit = 20): Promise<DiscordMessage[]> {
  if (!discordEnabled) return [];
  try {
    const messages = await discordFetch(
      `/channels/${channelId}/messages?limit=${limit}`,
    ) as DiscordMessage[];
    return messages.reverse(); // Oldest first
  } catch (e) {
    logger.warn({ channelId, error: String(e) }, 'Failed to read Discord messages');
    return [];
  }
}

/** Send a message to a channel */
export async function sendMessage(channelId: string, content: string): Promise<DiscordMessage | null> {
  if (!discordEnabled) return null;
  try {
    const msg = await discordFetch(`/channels/${channelId}/messages`, {
      method: 'POST',
      body: { content: content.slice(0, 2000) }, // Discord limit
    }) as DiscordMessage;
    return msg;
  } catch (e) {
    logger.warn({ channelId, error: String(e) }, 'Failed to send Discord message');
    return null;
  }
}

// ── Webhook Operations ──────────────────────────────────────────────

export interface WebhookEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: { text: string };
  timestamp?: string;
}

/** Post a message via webhook (no bot token needed) */
export async function postWebhook(
  content: string,
  options?: { embeds?: WebhookEmbed[]; username?: string },
): Promise<boolean> {
  const url = DISCORD_WEBHOOK_URL;
  if (!url) return false;

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: content.slice(0, 2000),
        embeds: options?.embeds,
        username: options?.username || 'Raw Claw',
      }),
    });
    return resp.ok;
  } catch (e) {
    logger.warn({ error: String(e) }, 'Failed to post Discord webhook');
    return false;
  }
}

/** Post a rich embed via webhook */
export async function postEmbed(embed: WebhookEmbed): Promise<boolean> {
  return postWebhook('', { embeds: [embed] });
}

// ── Alert Helpers ───────────────────────────────────────────────────

const COLORS = {
  success: 0x00ff00,   // Green
  warning: 0xffaa00,   // Orange
  error: 0xff0000,     // Red
  info: 0x0099ff,      // Blue
};

/** Post a health status alert */
export async function postHealthAlert(
  status: 'healthy' | 'degraded' | 'unhealthy',
  details: string,
): Promise<boolean> {
  const color = status === 'healthy' ? COLORS.success : status === 'degraded' ? COLORS.warning : COLORS.error;
  return postEmbed({
    title: `Health: ${status.toUpperCase()}`,
    description: details,
    color,
    timestamp: new Date().toISOString(),
    footer: { text: 'Raw Claw Health Monitor' },
  });
}

/** Post a budget alert */
export async function postBudgetAlert(
  agentId: string,
  severity: 'warning' | 'hard_stop',
  spend: number,
  limit: number,
): Promise<boolean> {
  const color = severity === 'warning' ? COLORS.warning : COLORS.error;
  return postEmbed({
    title: `Budget ${severity === 'warning' ? 'Warning' : 'EXCEEDED'}`,
    description: `Agent **${agentId}** has ${severity === 'warning' ? 'reached warning threshold' : 'exceeded budget limit'}`,
    color,
    fields: [
      { name: 'Current Spend', value: `$${spend.toFixed(2)}`, inline: true },
      { name: 'Limit', value: `$${limit.toFixed(2)}`, inline: true },
      { name: 'Utilization', value: `${Math.round((spend / limit) * 100)}%`, inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: 'Raw Claw Budget Governance' },
  });
}

/** Post a task completion notification */
export async function postTaskNotification(
  agentId: string,
  taskTitle: string,
  status: 'completed' | 'failed',
  duration?: string,
): Promise<boolean> {
  const color = status === 'completed' ? COLORS.success : COLORS.error;
  const fields = [
    { name: 'Agent', value: agentId, inline: true },
    { name: 'Status', value: status, inline: true },
  ];
  if (duration) {
    fields.push({ name: 'Duration', value: duration, inline: true });
  }
  return postEmbed({
    title: `Task: ${taskTitle}`,
    color,
    fields,
    timestamp: new Date().toISOString(),
    footer: { text: 'Raw Claw Mission Control' },
  });
}
