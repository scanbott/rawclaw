/**
 * Health Check & Monitoring for Raw Claw v2
 *
 * Provides /health endpoint + periodic self-check with alerting.
 * Adapted from dineline/monitoring/heartbeat.py pattern.
 */

import os from 'os';

import { logger } from './logger.js';
import { AGENT_ID, DASHBOARD_PORT } from './config.js';
import { supabaseEnabled, getSupabaseClient } from './supabase.js';
import { logSystemAction, ActionTypes } from './audit.js';
import { getTotalRuns, getActiveRuns } from './heartbeat.js';
import { getActivityCount } from './audit.js';

// ── Types ───────────────────────────────────────────────────────────

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface SubsystemHealth {
  name: string;
  status: HealthStatus;
  message: string;
  latency_ms?: number;
  details?: Record<string, unknown>;
}

export interface SystemHealth {
  status: HealthStatus;
  agent_id: string;
  uptime_seconds: number;
  timestamp: number;
  subsystems: SubsystemHealth[];
  system: {
    cpu_percent: number;
    memory_percent: number;
    memory_total_mb: number;
    memory_used_mb: number;
    platform: string;
    hostname: string;
    node_version: string;
  };
  stats: {
    total_heartbeat_runs: number;
    active_runs: number;
    activity_log_entries: number;
  };
}

// ── Health Check Functions ───────────────────────────────────────────

const startTime = Date.now();

// ── DB Registration (avoids circular imports) ──────────────────────

type DbTableNamesFn = () => string[];
type MemoryCountFn = () => number;
type ScheduledTasksFn = (agentId: string) => unknown[];

let _getDbTableNames: DbTableNamesFn | null = null;
let _getMemoryCount: MemoryCountFn | null = null;
let _getScheduledTasks: ScheduledTasksFn | null = null;

/** Register database query functions (called from index.ts after db init) */
export function registerHealthDb(fns: {
  getDbTableNames: DbTableNamesFn;
  getMemoryCount: MemoryCountFn;
  getScheduledTasks: ScheduledTasksFn;
}): void {
  _getDbTableNames = fns.getDbTableNames;
  _getMemoryCount = fns.getMemoryCount;
  _getScheduledTasks = fns.getScheduledTasks;
}

async function checkDatabase(): Promise<SubsystemHealth> {
  const start = Date.now();
  if (!_getDbTableNames) {
    return { name: 'database', status: 'degraded', message: 'Not initialized', latency_ms: 0 };
  }
  try {
    const tables = _getDbTableNames();
    return {
      name: 'database',
      status: 'healthy',
      message: `SQLite OK (${tables.length} tables)`,
      latency_ms: Date.now() - start,
      details: { tables: tables.length },
    };
  } catch (e) {
    return {
      name: 'database',
      status: 'unhealthy',
      message: `SQLite error: ${String(e)}`,
      latency_ms: Date.now() - start,
    };
  }
}

async function checkSupabase(): Promise<SubsystemHealth> {
  if (!supabaseEnabled) {
    return {
      name: 'supabase',
      status: 'healthy',
      message: 'Not configured (optional)',
    };
  }

  const start = Date.now();
  const client = getSupabaseClient();
  if (!client) {
    return {
      name: 'supabase',
      status: 'unhealthy',
      message: 'Client not initialized',
      latency_ms: Date.now() - start,
    };
  }

  try {
    const ok = await client.healthCheck();
    return {
      name: 'supabase',
      status: ok ? 'healthy' : 'unhealthy',
      message: ok ? 'Connected' : 'Connection failed',
      latency_ms: Date.now() - start,
    };
  } catch (e) {
    return {
      name: 'supabase',
      status: 'unhealthy',
      message: `Error: ${String(e)}`,
      latency_ms: Date.now() - start,
    };
  }
}

async function checkTelegramBot(): Promise<SubsystemHealth> {
  const { activeBotToken } = await import('./config.js');
  if (!activeBotToken) {
    return {
      name: 'telegram',
      status: 'unhealthy',
      message: 'TELEGRAM_BOT_TOKEN not set',
    };
  }
  return {
    name: 'telegram',
    status: 'healthy',
    message: 'Token configured',
  };
}

async function checkMemorySystem(): Promise<SubsystemHealth> {
  if (!_getMemoryCount) {
    return { name: 'memory', status: 'degraded', message: 'Not initialized' };
  }
  try {
    const count = _getMemoryCount();
    return {
      name: 'memory',
      status: 'healthy',
      message: `${count} memories stored`,
      details: { memory_count: count },
    };
  } catch (e) {
    return {
      name: 'memory',
      status: 'degraded',
      message: `Could not query memories: ${String(e)}`,
    };
  }
}

async function checkScheduler(): Promise<SubsystemHealth> {
  if (!_getScheduledTasks) {
    return { name: 'scheduler', status: 'degraded', message: 'Not initialized' };
  }
  try {
    const tasks = _getScheduledTasks(AGENT_ID);
    return {
      name: 'scheduler',
      status: 'healthy',
      message: `${tasks.length} active tasks`,
      details: { task_count: tasks.length },
    };
  } catch (e) {
    return {
      name: 'scheduler',
      status: 'degraded',
      message: `Could not query tasks: ${String(e)}`,
    };
  }
}

function getSystemMetrics(): SystemHealth['system'] {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const cpus = os.cpus();
  const cpuPercent = cpus.length > 0
    ? cpus.reduce((acc, cpu) => {
        const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
        const idle = cpu.times.idle;
        return acc + ((total - idle) / total) * 100;
      }, 0) / cpus.length
    : 0;

  return {
    cpu_percent: Math.round(cpuPercent * 10) / 10,
    memory_percent: Math.round((usedMem / totalMem) * 1000) / 10,
    memory_total_mb: Math.round(totalMem / 1024 / 1024),
    memory_used_mb: Math.round(usedMem / 1024 / 1024),
    platform: `${os.platform()} ${os.arch()}`,
    hostname: os.hostname(),
    node_version: process.version,
  };
}

// ── Main Health Check ───────────────────────────────────────────────

/**
 * Run all health checks and return a comprehensive status report.
 */
export async function getHealthStatus(): Promise<SystemHealth> {
  const subsystems = await Promise.all([
    checkDatabase(),
    checkSupabase(),
    checkTelegramBot(),
    checkMemorySystem(),
    checkScheduler(),
  ]);

  // Overall status: unhealthy if any critical subsystem is unhealthy
  const critical = ['database', 'telegram'];
  const hasCriticalFailure = subsystems.some(
    (s) => critical.includes(s.name) && s.status === 'unhealthy',
  );
  const hasDegradation = subsystems.some((s) => s.status !== 'healthy');

  const overallStatus: HealthStatus = hasCriticalFailure
    ? 'unhealthy'
    : hasDegradation
      ? 'degraded'
      : 'healthy';

  return {
    status: overallStatus,
    agent_id: AGENT_ID,
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    timestamp: Math.floor(Date.now() / 1000),
    subsystems,
    system: getSystemMetrics(),
    stats: {
      total_heartbeat_runs: getTotalRuns(),
      active_runs: getActiveRuns().length,
      activity_log_entries: getActivityCount(),
    },
  };
}

// ── Periodic Health Monitor ─────────────────────────────────────────

let healthInterval: ReturnType<typeof setInterval> | null = null;
let lastHealthStatus: HealthStatus = 'healthy';

/**
 * Start periodic health monitoring. Runs every 5 minutes.
 * Logs status changes and can be extended to alert via Discord/Slack.
 */
export function startHealthMonitor(intervalMs = 5 * 60 * 1000): void {
  if (healthInterval) return;

  healthInterval = setInterval(async () => {
    try {
      const health = await getHealthStatus();

      if (health.status !== lastHealthStatus) {
        logger.warn(
          { previous: lastHealthStatus, current: health.status },
          'Health status changed',
        );

        logSystemAction(ActionTypes.SYSTEM_HEALTH_CHECK, 'system', 'self', {
          previous_status: lastHealthStatus,
          current_status: health.status,
          subsystems: health.subsystems.map((s) => ({ name: s.name, status: s.status })),
        });

        lastHealthStatus = health.status;
      }
    } catch (e) {
      logger.error({ error: String(e) }, 'Health monitor check failed');
    }
  }, intervalMs);

  logger.info({ intervalMs }, 'Health monitor started');
}

/**
 * Stop the periodic health monitor.
 */
export function stopHealthMonitor(): void {
  if (healthInterval) {
    clearInterval(healthInterval);
    healthInterval = null;
    logger.info('Health monitor stopped');
  }
}
