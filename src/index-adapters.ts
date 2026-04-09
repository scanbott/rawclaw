/**
 * Raw Claw v3 — Adapter-Based Entry Point
 *
 * This is the new entry point that uses the adapter registry instead of
 * hardcoded Telegram. It loads adapters from config (ENABLED_ADAPTERS env var)
 * and routes all incoming messages through a unified handler.
 *
 * To use: set "main" in package.json to "dist/index-adapters.js"
 * or run: tsx src/index-adapters.ts
 *
 * The existing index.ts (Telegram-only) remains as a fallback.
 *
 * Environment:
 *   ENABLED_ADAPTERS=telegram                  (default, backward compat)
 *   ENABLED_ADAPTERS=telegram,discord           (multi-channel)
 *   ENABLED_ADAPTERS=telegram,discord,webhook   (with REST API)
 *   ENABLED_ADAPTERS=all                        (everything with valid config)
 */

import fs from 'fs';
import path from 'path';

import { loadAgentConfig, resolveAgentDir, resolveAgentClaudeMd } from './agent-config.js';
import { createBot, splitMessage, formatForTelegram } from './bot.js';
import { checkPendingMigrations } from './migrations.js';
import {
  ALLOWED_CHAT_ID,
  activeBotToken,
  STORE_DIR,
  PROJECT_ROOT,
  RAWCLAW_CONFIG,
  GOOGLE_API_KEY,
  setAgentOverrides,
  SECURITY_PIN_HASH,
  IDLE_LOCK_MINUTES,
  EMERGENCY_KILL_PHRASE,
  AGENT_ID as CONFIG_AGENT_ID,
} from './config.js';
import { startDashboard } from './dashboard.js';
import {
  initDatabase,
  cleanupOldMissionTasks,
  insertAuditLog,
  getDbTableNames,
  getMemoryCount,
  getAllScheduledTasks,
  insertHeartbeatRun,
  updateHeartbeatRun,
  getTokenSpendForBudget,
  getBudgetPolicies,
  clearSessionForAgent,
} from './db.js';
import { initSecurity, setAuditCallback } from './security.js';
import { logger } from './logger.js';
import { cleanupOldUploads } from './media.js';
import { runConsolidation } from './memory-consolidate.js';
import { runDecaySweep } from './memory.js';
import { initOrchestrator } from './orchestrator.js';
import { initScheduler } from './scheduler.js';
import { setTelegramConnected, setBotInfo } from './state.js';

// v2 modules
import { registerHeartbeatDb } from './heartbeat.js';
import { registerBudgetDb } from './budget.js';
import { registerHealthDb, startHealthMonitor, stopHealthMonitor } from './health.js';
import { registerSessionDb } from './session-compaction.js';
import { loadPlugins, shutdownPlugins } from './plugins.js';

// v3 adapter system
import {
  createAdapterRegistry,
  AdapterRegistry,
  TelegramAdapter,
  IncomingMessage,
} from './adapters/index.js';

// ── Agent Configuration ─────────────────────────────────────────────

const agentFlagIndex = process.argv.indexOf('--agent');
const AGENT_ID = agentFlagIndex !== -1 ? process.argv[agentFlagIndex + 1] : 'main';
process.env.RAWCLAW_AGENT_ID = AGENT_ID;

if (AGENT_ID !== 'main') {
  const agentConfig = loadAgentConfig(AGENT_ID);
  const agentDir = resolveAgentDir(AGENT_ID);
  const claudeMdPath = resolveAgentClaudeMd(AGENT_ID);
  let systemPrompt: string | undefined;
  if (claudeMdPath) {
    try {
      systemPrompt = fs.readFileSync(claudeMdPath, 'utf-8');
    } catch { /* no CLAUDE.md */ }
  }
  setAgentOverrides({
    agentId: AGENT_ID,
    botToken: agentConfig.botToken,
    cwd: agentDir,
    model: agentConfig.model,
    obsidian: agentConfig.obsidian,
    systemPrompt,
  });
  logger.info({ agentId: AGENT_ID, name: agentConfig.name }, 'Running as agent');
} else {
  const externalClaudeMd = path.join(RAWCLAW_CONFIG, 'CLAUDE.md');
  if (fs.existsSync(externalClaudeMd)) {
    let systemPrompt: string | undefined;
    try {
      systemPrompt = fs.readFileSync(externalClaudeMd, 'utf-8');
    } catch { /* unreadable */ }
    if (systemPrompt) {
      setAgentOverrides({
        agentId: 'main',
        botToken: activeBotToken,
        cwd: PROJECT_ROOT,
        systemPrompt,
      });
      logger.info({ source: externalClaudeMd }, 'Loaded CLAUDE.md from RAWCLAW_CONFIG');
    }
  } else if (!fs.existsSync(path.join(PROJECT_ROOT, 'CLAUDE.md'))) {
    logger.warn(
      'No CLAUDE.md found. Copy CLAUDE.md.example to %s/CLAUDE.md and customize it.',
      RAWCLAW_CONFIG,
    );
  }
}

// ── Lock Management ─────────────────────────────────────────────────

const PID_FILE = path.join(STORE_DIR, `${AGENT_ID === 'main' ? 'rawclaw' : `agent-${AGENT_ID}`}.pid`);

function showBanner(): void {
  const bannerPath = path.join(PROJECT_ROOT, 'banner.txt');
  try {
    const banner = fs.readFileSync(bannerPath, 'utf-8');
    console.log('\n' + banner);
  } catch {
    console.log('\n  RawClaw v3\n');
  }
}

function acquireLock(): void {
  fs.mkdirSync(STORE_DIR, { recursive: true });
  try {
    if (fs.existsSync(PID_FILE)) {
      const old = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10);
      if (!isNaN(old) && old !== process.pid) {
        try {
          process.kill(old, 'SIGTERM');
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
        } catch { /* already dead */ }
      }
    }
  } catch { /* ignore */ }
  fs.writeFileSync(PID_FILE, String(process.pid), { mode: 0o600 });
}

function releaseLock(): void {
  try { fs.unlinkSync(PID_FILE); } catch { /* ignore */ }
}

// ── Main ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  checkPendingMigrations(PROJECT_ROOT);

  if (AGENT_ID === 'main') {
    showBanner();
  }

  if (!activeBotToken) {
    if (AGENT_ID === 'main') {
      logger.error('Bot token is not set. Run npm run setup to configure it.');
    } else {
      logger.error({ agentId: AGENT_ID }, `Configuration for agent "${AGENT_ID}" is broken: bot token not set.`);
    }
    process.exit(1);
  }

  acquireLock();

  // ── Database & modules ──────────────────────────────────────────

  initDatabase();
  logger.info('Database ready');

  registerHeartbeatDb({ insertRun: insertHeartbeatRun, updateRun: updateHeartbeatRun });
  registerBudgetDb({ getSpend: getTokenSpendForBudget, getPolicies: getBudgetPolicies });
  registerHealthDb({ getDbTableNames, getMemoryCount, getScheduledTasks: getAllScheduledTasks });
  registerSessionDb({ clearSession: clearSessionForAgent });
  logger.info('v2 modules registered');

  initSecurity({
    pinHash: SECURITY_PIN_HASH || undefined,
    idleLockMinutes: IDLE_LOCK_MINUTES,
    killPhrase: EMERGENCY_KILL_PHRASE || undefined,
  });
  setAuditCallback((entry) => {
    insertAuditLog(entry.agentId, entry.chatId, entry.action, entry.detail, entry.blocked);
  });

  initOrchestrator();

  if (AGENT_ID === 'main') {
    try {
      await loadPlugins();
      logger.info('Plugins loaded');
    } catch (e) {
      logger.warn({ error: String(e) }, 'Plugin loading failed (non-fatal)');
    }
    startHealthMonitor();
  }

  if (AGENT_ID === 'main') {
    runDecaySweep();
    cleanupOldMissionTasks(7);
    setInterval(() => { runDecaySweep(); cleanupOldMissionTasks(7); }, 24 * 60 * 60 * 1000);

    if (ALLOWED_CHAT_ID && GOOGLE_API_KEY) {
      setTimeout(() => {
        void runConsolidation(ALLOWED_CHAT_ID).catch((err) =>
          logger.error({ err }, 'Initial consolidation failed'),
        );
      }, 2 * 60 * 1000);
      setInterval(() => {
        void runConsolidation(ALLOWED_CHAT_ID).catch((err) =>
          logger.error({ err }, 'Periodic consolidation failed'),
        );
      }, 30 * 60 * 1000);
      logger.info('Memory consolidation enabled (every 30 min)');
    }
  }

  cleanupOldUploads();

  // ── Create the legacy bot (Telegram-specific handlers) ──────────
  // The existing createBot() is kept for backward compatibility.
  // It handles all the Telegram-specific command registration (/help, /newchat, etc.)
  // and the core message processing pipeline (memory, delegation, agent execution).
  // The adapter system wraps around it, providing a uniform receive/send interface.
  const bot = createBot();

  // ── Adapter Registry ────────────────────────────────────────────

  const registry = createAdapterRegistry();

  // Override the Telegram adapter's token/chatId to match the legacy bot config
  const telegramAdapter = registry.get<TelegramAdapter>('telegram');
  if (telegramAdapter) {
    telegramAdapter.setBotToken(activeBotToken);
    telegramAdapter.setAllowedChatId(ALLOWED_CHAT_ID);
  }

  // Set up the global message handler for non-Telegram adapters.
  // Telegram messages still flow through the legacy bot.ts handlers for full
  // feature parity (voice, WhatsApp, Slack browsing, /commands, streaming, etc.)
  // Non-Telegram adapters route through a simplified pipeline.
  registry.onMessage = async (msg: IncomingMessage, adapterName: string) => {
    if (adapterName === 'telegram') {
      // Telegram messages are handled by the legacy grammy bot — skip adapter routing
      return;
    }

    // For non-Telegram adapters: use the adapter system's sendResponse.
    // The full message processing pipeline (memory, agent execution) is
    // handled by the legacy handleMessage in bot.ts.
    // In the future, this will be refactored to use a channel-agnostic pipeline.
    logger.info({ adapter: adapterName, threadId: msg.threadId, textLen: msg.text.length }, 'Adapter message received');

    // For now, non-Telegram adapters get a simple response
    // TODO: Wire into the full agent execution pipeline (extract handleMessage from bot.ts)
    const adapter = registry.get(adapterName);
    if (adapter) {
      await adapter.sendResponse(
        msg.threadId,
        `Message received via ${adapter.channelName}. Full agent pipeline integration coming in the next phase.`,
        msg.metadata,
      );
    }
  };

  // Initialize and start all enabled adapters (except Telegram, which uses the legacy bot)
  await registry.initAll();

  // Log adapter status
  for (const status of registry.getStatus()) {
    if (status.enabled) {
      logger.info({
        adapter: status.name,
        channel: status.channelName,
        initialized: status.initialized,
        error: status.error,
      }, 'Adapter status');
    }
  }

  // Start non-Telegram adapters
  // (Telegram starts via bot.start() below for backward compat)
  const nonTelegramAdapters = registry.getStatus()
    .filter((s) => s.name !== 'telegram' && s.initialized);

  for (const status of nonTelegramAdapters) {
    const adapter = registry.get(status.name);
    if (adapter) {
      try {
        if (adapter instanceof (await import('./adapters/discord.js')).DiscordAdapter) {
          await (adapter as any).start();
          logger.info({ adapter: status.name }, `${status.channelName} adapter connected`);
        } else if (adapter instanceof (await import('./adapters/slack.js')).SlackAdapter) {
          await (adapter as any).start();
          logger.info({ adapter: status.name }, `${status.channelName} adapter connected`);
        } else if (adapter instanceof (await import('./adapters/webhook.js')).WebhookAdapter) {
          await (adapter as any).start();
          logger.info({ adapter: status.name }, `${status.channelName} adapter ready`);
        }
      } catch (err) {
        logger.error({ adapter: status.name, err }, 'Adapter start failed');
      }
    }
  }

  // ── Dashboard ───────────────────────────────────────────────────

  if (AGENT_ID === 'main') {
    startDashboard(bot.api);
  }

  // ── Scheduler ───────────────────────────────────────────────────

  if (ALLOWED_CHAT_ID) {
    initScheduler(
      async (text) => {
        for (const chunk of splitMessage(text)) {
          await bot.api.sendMessage(ALLOWED_CHAT_ID, chunk, { parse_mode: 'HTML' }).catch((err) =>
            logger.error({ err }, 'Scheduler failed to send message'),
          );
        }
      },
      AGENT_ID,
    );
  } else {
    logger.warn('ALLOWED_CHAT_ID not set - scheduler disabled');
  }

  // ── Shutdown ────────────────────────────────────────────────────

  const shutdown = async () => {
    logger.info('Shutting down...');
    stopHealthMonitor();
    await shutdownPlugins();
    await registry.shutdownAll();
    setTelegramConnected(false);
    releaseLock();
    await bot.stop();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());

  // ── Start Telegram (legacy bot) ─────────────────────────────────

  logger.info({ agentId: AGENT_ID }, 'Starting RawClaw v3...');

  await bot.start({
    onStart: (botInfo) => {
      setTelegramConnected(true);
      setBotInfo(botInfo.username ?? '', botInfo.first_name ?? 'RawClaw');
      logger.info({ username: botInfo.username }, 'RawClaw is running');

      const runningAdapters = registry.getRunningAdapterNames();
      const adapterList = runningAdapters.length > 0
        ? ` + ${runningAdapters.join(', ')}`
        : '';

      if (AGENT_ID === 'main') {
        console.log(`\n  RawClaw v3 online: @${botInfo.username}${adapterList}`);
        if (!ALLOWED_CHAT_ID) {
          console.log(`  Send /chatid to get your chat ID for ALLOWED_CHAT_ID`);
        }
        console.log();
      } else {
        console.log(`\n  RawClaw v3 agent [${AGENT_ID}] online: @${botInfo.username}${adapterList}\n`);
      }
    },
  });
}

main().catch((err: unknown) => {
  logger.error({ err }, 'Fatal error');
  releaseLock();
  process.exit(1);
});
