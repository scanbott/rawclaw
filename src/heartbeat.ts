/**
 * Heartbeat Execution Model for Raw Claw v2
 *
 * Wraps every agent execution in a heartbeat_run record to provide
 * complete visibility: tokens used, cost, duration, exit code,
 * session state before/after. Enables dead agent detection and
 * historical analysis of all agent work.
 *
 * Pattern stolen from Paperclip's heartbeat.ts.
 */

import crypto from 'crypto';

import { logger } from './logger.js';
import { AGENT_ID } from './config.js';
import { runAgent, type AgentResult, type UsageInfo } from './agent.js';
import { checkBudget, estimateCost, type BudgetCheckResult } from './budget.js';
import { logAgentAction, ActionTypes } from './audit.js';
import { supabaseWrite, supabaseUpdate } from './supabase.js';

// ── Types ───────────────────────────────────────────────────────────

export type InvocationSource = 'on_demand' | 'timer' | 'mission' | 'delegation' | 'assignment';
export type HeartbeatStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'budget_blocked';

export interface HeartbeatRun {
  id: string;
  agent_id: string;
  invocation_source: InvocationSource;
  status: HeartbeatStatus;
  prompt_preview: string;
  input_tokens: number;
  output_tokens: number;
  cache_tokens: number;
  cost_usd: number;
  duration_ms: number;
  exit_code: number | null;
  session_id_before: string | null;
  session_id_after: string | null;
  error: string | null;
  model: string | null;
  started_at: number;
  completed_at: number | null;
}

export interface HeartbeatOptions {
  agentId?: string;
  source?: InvocationSource;
  sessionId?: string;
  model?: string;
  chatId?: string;
  abortController?: AbortController;
  onTyping?: () => void;
  onProgress?: (event: { type: string; description: string }) => void;
  onStreamText?: (text: string) => void;
}

export interface HeartbeatResult {
  run: HeartbeatRun;
  agentResult: AgentResult;
  budgetCheck: BudgetCheckResult;
}

// ── In-Memory Store ─────────────────────────────────────────────────

const MAX_RUNS_BUFFER = 500;
const runsBuffer: HeartbeatRun[] = [];

// ── Core Execution ──────────────────────────────────────────────────

/**
 * Execute an agent run with full heartbeat tracking.
 *
 * This wraps runAgent() from agent.ts and:
 * 1. Checks budget before execution
 * 2. Creates a heartbeat_run record (status: 'running')
 * 3. Calls runAgent()
 * 4. Updates the record with results
 * 5. Dual-writes to Supabase
 */
export async function executeWithHeartbeat(
  prompt: string,
  options: HeartbeatOptions = {},
): Promise<HeartbeatResult> {
  const agentId = options.agentId || AGENT_ID;
  const source = options.source || 'on_demand';
  const startTime = Date.now();

  // 1. Check budget
  const budgetCheck = checkBudget(agentId);
  if (!budgetCheck.allowed) {
    const blockedRun: HeartbeatRun = {
      id: crypto.randomUUID(),
      agent_id: agentId,
      invocation_source: source,
      status: 'budget_blocked',
      prompt_preview: prompt.slice(0, 200),
      input_tokens: 0,
      output_tokens: 0,
      cache_tokens: 0,
      cost_usd: 0,
      duration_ms: Date.now() - startTime,
      exit_code: null,
      session_id_before: options.sessionId || null,
      session_id_after: null,
      error: budgetCheck.reason || 'Budget exceeded',
      model: options.model || null,
      started_at: Math.floor(startTime / 1000),
      completed_at: Math.floor(Date.now() / 1000),
    };

    saveRun(blockedRun);

    logAgentAction(ActionTypes.AGENT_FAILED, 'heartbeat_run', blockedRun.id, {
      reason: 'budget_blocked',
      current_spend: budgetCheck.current_spend,
      limit_usd: budgetCheck.limit_usd,
    }, agentId);

    return {
      run: blockedRun,
      agentResult: { text: `Budget limit reached: ${budgetCheck.reason}`, newSessionId: undefined, usage: null },
      budgetCheck,
    };
  }

  // 2. Create initial heartbeat record
  const run: HeartbeatRun = {
    id: crypto.randomUUID(),
    agent_id: agentId,
    invocation_source: source,
    status: 'running',
    prompt_preview: prompt.slice(0, 200),
    input_tokens: 0,
    output_tokens: 0,
    cache_tokens: 0,
    cost_usd: 0,
    duration_ms: 0,
    exit_code: null,
    session_id_before: options.sessionId || null,
    session_id_after: null,
    error: null,
    model: options.model || null,
    started_at: Math.floor(startTime / 1000),
    completed_at: null,
  };

  saveRun(run);

  logAgentAction(ActionTypes.AGENT_STARTED, 'heartbeat_run', run.id, {
    source,
    prompt_preview: run.prompt_preview,
  }, agentId);

  // 3. Execute via agent.ts
  let agentResult: AgentResult;
  const noop = () => {};
  try {
    agentResult = await runAgent(
      prompt,
      options.sessionId,
      options.onTyping || noop,
      options.onProgress,
      options.model,
      options.abortController,
      options.onStreamText,
    );
  } catch (e) {
    // Agent execution failed
    const endTime = Date.now();
    run.status = 'failed';
    run.error = String(e);
    run.duration_ms = endTime - startTime;
    run.completed_at = Math.floor(endTime / 1000);

    updateRun(run);

    logAgentAction(ActionTypes.AGENT_FAILED, 'heartbeat_run', run.id, {
      error: run.error,
      duration_ms: run.duration_ms,
    }, agentId);

    return {
      run,
      agentResult: { text: '', newSessionId: undefined, usage: null },
      budgetCheck,
    };
  }

  // 4. Update heartbeat record with results
  const endTime = Date.now();
  const usage = agentResult.usage;

  run.status = 'completed';
  run.duration_ms = endTime - startTime;
  run.completed_at = Math.floor(endTime / 1000);
  run.session_id_after = agentResult.newSessionId || null;

  if (usage) {
    run.input_tokens = usage.inputTokens || 0;
    run.output_tokens = usage.outputTokens || 0;
    run.cache_tokens = usage.cacheReadInputTokens || 0;
    run.cost_usd = estimateCost(
      run.input_tokens,
      run.output_tokens,
      run.cache_tokens,
      options.model,
    );
  }

  updateRun(run);

  logAgentAction(ActionTypes.AGENT_COMPLETED, 'heartbeat_run', run.id, {
    duration_ms: run.duration_ms,
    cost_usd: run.cost_usd,
    input_tokens: run.input_tokens,
    output_tokens: run.output_tokens,
  }, agentId);

  logger.info(
    {
      runId: run.id,
      agentId,
      source,
      duration: `${(run.duration_ms / 1000).toFixed(1)}s`,
      cost: `$${run.cost_usd.toFixed(4)}`,
      tokens: { input: run.input_tokens, output: run.output_tokens, cache: run.cache_tokens },
    },
    'Heartbeat run completed',
  );

  return { run, agentResult, budgetCheck };
}

// ── DB Registration (avoids circular imports) ──────────────────────

type InsertRunFn = (run: HeartbeatRun) => void;
type UpdateRunFn = (run: HeartbeatRun) => void;

let _insertRun: InsertRunFn | null = null;
let _updateRun: UpdateRunFn | null = null;

/** Register database functions (called from index.ts after db init) */
export function registerHeartbeatDb(fns: {
  insertRun: InsertRunFn;
  updateRun: UpdateRunFn;
}): void {
  _insertRun = fns.insertRun;
  _updateRun = fns.updateRun;
}

// ── Persistence Helpers ─────────────────────────────────────────────

function saveRun(run: HeartbeatRun): void {
  // Buffer in memory
  runsBuffer.push(run);
  if (runsBuffer.length > MAX_RUNS_BUFFER) {
    runsBuffer.shift();
  }

  // Write to SQLite via registered function
  if (_insertRun) {
    try { _insertRun(run); } catch { /* db not ready */ }
  }

  // Dual-write to Supabase
  supabaseWrite('heartbeat_runs', {
    id: run.id,
    agent_id: run.agent_id,
    invocation_source: run.invocation_source,
    status: run.status,
    prompt_preview: run.prompt_preview,
    input_tokens: run.input_tokens,
    output_tokens: run.output_tokens,
    cache_tokens: run.cache_tokens,
    cost_usd: run.cost_usd,
    duration_ms: run.duration_ms,
    exit_code: run.exit_code,
    session_id_before: run.session_id_before,
    session_id_after: run.session_id_after,
    error: run.error,
    model: run.model,
    started_at: run.started_at,
    completed_at: run.completed_at,
  }).catch(() => {});
}

function updateRun(run: HeartbeatRun): void {
  // Update in buffer
  const idx = runsBuffer.findIndex((r) => r.id === run.id);
  if (idx !== -1) runsBuffer[idx] = run;

  // Update SQLite via registered function
  if (_updateRun) {
    try { _updateRun(run); } catch { /* db not ready */ }
  }

  // Update Supabase
  supabaseUpdate('heartbeat_runs', {
    status: run.status,
    input_tokens: run.input_tokens,
    output_tokens: run.output_tokens,
    cache_tokens: run.cache_tokens,
    cost_usd: run.cost_usd,
    duration_ms: run.duration_ms,
    exit_code: run.exit_code,
    session_id_after: run.session_id_after,
    error: run.error,
    completed_at: run.completed_at,
  }, `id=eq.${run.id}`).catch(() => {});
}

// ── Query Functions ─────────────────────────────────────────────────

/** Get recent heartbeat runs from buffer */
export function getRecentRuns(limit = 50, agentId?: string): HeartbeatRun[] {
  let runs = [...runsBuffer].reverse();
  if (agentId) {
    runs = runs.filter((r) => r.agent_id === agentId);
  }
  return runs.slice(0, limit);
}

/** Get a specific run by ID */
export function getRun(runId: string): HeartbeatRun | undefined {
  return runsBuffer.find((r) => r.id === runId);
}

/** Get aggregate stats for an agent */
export function getAgentStats(agentId: string): {
  total_runs: number;
  completed: number;
  failed: number;
  total_cost: number;
  total_input_tokens: number;
  total_output_tokens: number;
  avg_duration_ms: number;
  last_run_at: number | null;
} {
  const runs = runsBuffer.filter((r) => r.agent_id === agentId);
  const completed = runs.filter((r) => r.status === 'completed');
  const failed = runs.filter((r) => r.status === 'failed');

  const totalCost = runs.reduce((sum, r) => sum + r.cost_usd, 0);
  const totalInput = runs.reduce((sum, r) => sum + r.input_tokens, 0);
  const totalOutput = runs.reduce((sum, r) => sum + r.output_tokens, 0);
  const avgDuration = completed.length > 0
    ? completed.reduce((sum, r) => sum + r.duration_ms, 0) / completed.length
    : 0;
  const lastRun = runs.length > 0 ? runs[runs.length - 1]!.started_at : null;

  return {
    total_runs: runs.length,
    completed: completed.length,
    failed: failed.length,
    total_cost: totalCost,
    total_input_tokens: totalInput,
    total_output_tokens: totalOutput,
    avg_duration_ms: avgDuration,
    last_run_at: lastRun,
  };
}

/** Get total runs count */
export function getTotalRuns(): number {
  return runsBuffer.length;
}

/** Get currently running heartbeats */
export function getActiveRuns(): HeartbeatRun[] {
  return runsBuffer.filter((r) => r.status === 'running');
}

/** Reset stuck runs on startup (from 'running' to 'failed') */
export function resetStuckRuns(): void {
  for (const run of runsBuffer) {
    if (run.status === 'running') {
      run.status = 'failed';
      run.error = 'Process restart -- run was interrupted';
      run.completed_at = Math.floor(Date.now() / 1000);
      updateRun(run);
    }
  }
}
