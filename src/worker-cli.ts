#!/usr/bin/env node
/**
 * BusinessOS Worker CLI
 *
 * Spawns a headless agent worker to execute a mission task or direct prompt.
 * No Telegram bot required. Uses the full Claude agent runtime with all skills/tools.
 *
 * Usage:
 *   node dist/worker-cli.js --task <mission-task-id>
 *   node dist/worker-cli.js --agent <agent-id> --prompt "Do X"
 *   node dist/worker-cli.js --prompt "Do X"  (uses generic worker context)
 *
 * The worker:
 *   1. Loads the target agent's CLAUDE.md as system context (or generic worker if none)
 *   2. Claims and executes the mission task
 *   3. Marks it complete and logs to hive_mind
 *   4. Exits
 */

import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

import { PROJECT_ROOT } from './config.js';
import {
  initDatabase,
  getMissionTask,
  completeMissionTask,
  logToHiveMind,
} from './db.js';
import { runAgent } from './agent.js';
import { logger } from './logger.js';
import { resolveAgentClaudeMd } from './agent-config.js';

// ── Parse args ────────────────────────────────────────────────────────

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--') && i + 1 < argv.length) {
      args[arg.slice(2)] = argv[++i];
    }
  }
  return args;
}

const args = parseArgs(process.argv);
const taskId = args['task'];
const agentId = args['agent'] ?? 'worker';
const directPrompt = args['prompt'];

if (!taskId && !directPrompt) {
  console.error('Usage: worker-cli --task <id>  OR  worker-cli --prompt "..." [--agent <id>]');
  process.exit(1);
}

// ── Generic worker system prompt ──────────────────────────────────────

const GENERIC_WORKER_PROMPT = `
You are a [COMPANY_NAME] worker agent. You are a temporary specialist spun up to execute a specific task.

You have full access to all tools: Bash, file system, web search, browser automation, and all MCP servers.

Key context:
- Project root: ${PROJECT_ROOT}
- Obsidian vault: ~/knowledge
- Load .env from ${PROJECT_ROOT}/.env for credentials
- Supabase URL and keys are in .env
- All skills are in ~/.claude/skills/

After completing your task:
1. Log what you did to hive_mind:
   sqlite3 ${PROJECT_ROOT}/store/businessos.db "INSERT INTO hive_mind (agent_id, chat_id, action, summary, created_at) VALUES ('worker', 'worker-task', 'task_complete', 'SUMMARY', strftime('%s','now'));"
2. Be thorough. Don't stop early. Complete the full task.
3. Report your output clearly.
`.trim();

// ── Load agent context ────────────────────────────────────────────────

function loadAgentContext(id: string): string {
  // Try to load the named agent's CLAUDE.md for context
  const claudeMd = resolveAgentClaudeMd(id);
  if (claudeMd && fs.existsSync(claudeMd)) {
    const content = fs.readFileSync(claudeMd, 'utf-8');
    logger.info({ agentId: id }, 'Worker loaded agent context');
    return content;
  }
  logger.info({ agentId: id }, 'Worker using generic context');
  return GENERIC_WORKER_PROMPT;
}

// ── Main ──────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  initDatabase();

  let prompt: string;
  let missionTask: ReturnType<typeof getMissionTask> = null;

  if (taskId) {
    // Load from mission_tasks
    missionTask = getMissionTask(taskId);
    if (!missionTask) {
      console.error(`Mission task not found: ${taskId}`);
      process.exit(1);
    }
    if (missionTask.status === 'completed' || missionTask.status === 'running') {
      console.log(`Task ${taskId} is already ${missionTask.status}, skipping.`);
      process.exit(0);
    }
    prompt = missionTask.prompt;
    const resolvedAgent = missionTask.assigned_agent ?? agentId;

    // Mark as running via direct DB write
    const dbPath = path.join(PROJECT_ROOT, 'store', 'businessos.db');
    const rawDb = new Database(dbPath);
    rawDb.prepare(`UPDATE mission_tasks SET status = 'running' WHERE id = ?`).run(taskId);
    rawDb.close();

    logger.info({ taskId, agent: resolvedAgent }, 'Worker claiming task');
    console.log(`[Worker] Executing task: ${missionTask.title}`);

    // Build system context from assigned agent
    const systemContext = loadAgentContext(resolvedAgent);
    const fullPrompt = `${systemContext}\n\n---\n\nTASK:\n${prompt}`;

    const abortController = new AbortController();
    const result = await runAgent(fullPrompt, undefined, () => {}, undefined, undefined, abortController);

    const output = result.text ?? '(no output)';
    const status = result.aborted ? 'failed' : 'completed';

    completeMissionTask(taskId, output.slice(0, 4000), status);
    logToHiveMind(
      resolvedAgent,
      `worker-${taskId.slice(0, 8)}`,
      'mission_complete',
      `Worker completed: ${missionTask.title}. ${output.slice(0, 200)}`,
    );

    console.log(`[Worker] Done. Status: ${status}`);
    console.log(`[Worker] Output:\n${output.slice(0, 500)}`);

  } else if (directPrompt) {
    // Direct prompt execution
    const systemContext = loadAgentContext(agentId);
    const fullPrompt = agentId !== 'worker'
      ? `${systemContext}\n\n---\n\nTASK:\n${directPrompt}`
      : `${GENERIC_WORKER_PROMPT}\n\n---\n\nTASK:\n${directPrompt}`;

    logger.info({ agentId }, 'Worker executing direct prompt');
    console.log(`[Worker] Executing direct prompt as ${agentId}`);

    const abortController = new AbortController();
    const result = await runAgent(fullPrompt, undefined, () => {}, undefined, undefined, abortController);

    console.log(`[Worker] Done.`);
    console.log(`[Worker] Output:\n${result.text?.slice(0, 1000) ?? '(no output)'}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('[Worker] Fatal:', err);
  process.exit(1);
});
