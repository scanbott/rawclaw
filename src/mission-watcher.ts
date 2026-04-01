#!/usr/bin/env node
/**
 * BusinessOS Mission Watcher
 *
 * Runs every 5 minutes. Checks for mission tasks that have been queued
 * too long (>10 min) and auto-spawns worker processes to handle them.
 *
 * This is the "hire a temp employee" system — if all named agents are
 * busy on their own heartbeats, workers fill the gaps automatically.
 *
 * Also processes inter_agent_tasks: agents send direct messages to each
 * other via the DB, the watcher routes them to the target agent's runner.
 *
 * Usage: node dist/mission-watcher.js
 * (Runs once, meant to be called from a cron/scheduled task)
 */

import path from 'path';
import { spawn } from 'child_process';
import Database from 'better-sqlite3';

import { PROJECT_ROOT } from './config.js';
import { initDatabase, logToHiveMind } from './db.js';
import { logger } from './logger.js';

const DB_PATH = path.join(PROJECT_ROOT, 'store', 'businessos.db');
const STALE_THRESHOLD_MINUTES = 10;
const MAX_CONCURRENT_WORKERS = 3;

// ── Spawn a worker process for a task ────────────────────────────────

function spawnWorker(taskId: string, agentId: string): Promise<void> {
  return new Promise((resolve) => {
    const workerPath = path.join(PROJECT_ROOT, 'dist', 'worker-cli.js');
    const child = spawn(
      'node',
      [workerPath, '--task', taskId, '--agent', agentId],
      {
        cwd: PROJECT_ROOT,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, BUSINESSOS_AGENT_ID: `worker-${agentId}` },
        detached: false,
      }
    );

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (d: Buffer) => { stdout += d.toString(); });
    child.stderr?.on('data', (d: Buffer) => { stderr += d.toString(); });

    child.on('close', (code) => {
      logger.info({ taskId, agentId, code }, 'Worker process exited');
      if (code !== 0) {
        logger.warn({ taskId, stderr: stderr.slice(0, 200) }, 'Worker exited with error');
      }
      resolve();
    });

    child.on('error', (err) => {
      logger.error({ taskId, err }, 'Failed to spawn worker');
      resolve();
    });
  });
}

// ── Determine best agent for an unassigned/stale task ─────────────────

function inferAgentFromTask(title: string, prompt: string): string {
  const text = (title + ' ' + prompt).toLowerCase();

  if (/revenue|stripe|mrr|billing|invoice|cost|budget|financial/.test(text)) return 'finance';
  if (/content|script|reel|instagram|youtube|post|hook|caption/.test(text)) return 'content';
  if (/code|build|deploy|api|database|migration|bug|fix|technical/.test(text)) return 'dev';
  if (/research|analyz|competitor|market|data|report/.test(text)) return 'research';
  if (/client|onboard|health|relationship/.test(text)) return 'ops';
  if (/sales|dm|proposal|prospect|close|lead/.test(text)) return 'comms';
  if (/design|brand|copy|voice|email|sequence/.test(text)) return 'comms';

  return 'ops'; // Default generalist
}

// ── Main watcher logic ────────────────────────────────────────────────

async function main(): Promise<void> {
  initDatabase();
  const db = new Database(DB_PATH);

  const staleThresholdSecs = STALE_THRESHOLD_MINUTES * 60;
  const now = Math.floor(Date.now() / 1000);
  const cutoff = now - staleThresholdSecs;

  // Find stale queued tasks
  const staleTasks = db.prepare(`
    SELECT * FROM mission_tasks
    WHERE status = 'queued'
    AND created_at < ?
    ORDER BY priority DESC, created_at ASC
    LIMIT ?
  `).all(cutoff, MAX_CONCURRENT_WORKERS) as Array<{
    id: string;
    title: string;
    prompt: string;
    assigned_agent: string | null;
    priority: number;
    created_at: number;
  }>;

  if (staleTasks.length === 0) {
    logger.info('Mission watcher: no stale tasks found');
    db.close();
    return;
  }

  logger.info({ count: staleTasks.length }, 'Mission watcher: spawning workers for stale tasks');

  // Spawn workers in parallel
  const workerPromises = staleTasks.map((task) => {
    const agentId = task.assigned_agent ?? inferAgentFromTask(task.title, task.prompt);
    const waitedMin = Math.round((now - task.created_at) / 60);

    logger.info({ taskId: task.id, title: task.title, agentId, waitedMin }, 'Spawning worker');
    console.log(`[Watcher] Spawning worker for "${task.title}" (waited ${waitedMin}m) → agent: ${agentId}`);

    return spawnWorker(task.id, agentId);
  });

  await Promise.all(workerPromises);

  logToHiveMind(
    'watcher',
    'mission-watcher',
    'workers_spawned',
    `Auto-spawned ${staleTasks.length} worker(s) for stale tasks: ${staleTasks.map(t => t.title).join(', ')}`,
  );

  // Also check inter_agent_tasks and route them
  const pendingMessages = db.prepare(`
    SELECT * FROM inter_agent_tasks
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT 5
  `).all() as Array<{
    id: string;
    from_agent: string;
    to_agent: string;
    chat_id: string;
    prompt: string;
  }>;

  if (pendingMessages.length > 0) {
    console.log(`[Watcher] Processing ${pendingMessages.length} inter-agent message(s)`);

    for (const msg of pendingMessages) {
      // Mark as processing
      db.prepare(`UPDATE inter_agent_tasks SET status = 'processing' WHERE id = ?`).run(msg.id);

      const workerPath = path.join(PROJECT_ROOT, 'dist', 'worker-cli.js');
      const fullPrompt = `You received a message from agent @${msg.from_agent}:\n\n${msg.prompt}`;

      const child = spawn(
        'node',
        [workerPath, '--agent', msg.to_agent, '--prompt', fullPrompt],
        {
          cwd: PROJECT_ROOT,
          stdio: ['ignore', 'pipe', 'pipe'],
          env: { ...process.env, BUSINESSOS_AGENT_ID: `worker-${msg.to_agent}` },
          detached: false,
        }
      );

      let result = '';
      child.stdout?.on('data', (d: Buffer) => { result += d.toString(); });

      child.on('close', () => {
        db.prepare(
          `UPDATE inter_agent_tasks SET status = 'completed', result = ?, completed_at = datetime('now') WHERE id = ?`
        ).run(result.slice(0, 2000), msg.id);
      });
    }
  }

  db.close();
  console.log('[Watcher] Done.');
}

main().catch((err) => {
  console.error('[Watcher] Fatal:', err);
  process.exit(1);
});
