/**
 * Budget Governance System for Raw Claw v2
 *
 * Per-agent budget policies with configurable windows (daily/monthly/lifetime).
 * Warning thresholds (default 80%), hard-stop enforcement (auto-pause),
 * incident logging. Checks budget before each agent run.
 *
 * Stolen from Paperclip's budget governance pattern, adapted for
 * Raw Claw's SQLite + optional Supabase architecture.
 */

import crypto from 'crypto';

import { AGENT_ID } from './config.js';
import { logger } from './logger.js';
import { logSystemAction, ActionTypes } from './audit.js';
import { supabaseWrite } from './supabase.js';

// ── Types ───────────────────────────────────────────────────────────

export type BudgetWindow = 'daily' | 'monthly' | 'lifetime';
export type BudgetScope = 'agent' | 'company';

export interface BudgetPolicy {
  id: string;
  scope: BudgetScope;
  scope_id: string;
  window: BudgetWindow;
  limit_usd: number;
  warning_threshold: number; // 0.0-1.0 (default 0.8)
  auto_pause: boolean;
  created_at: number;
}

export interface BudgetIncident {
  id: string;
  policy_id: string;
  agent_id: string;
  severity: 'warning' | 'hard_stop';
  current_spend: number;
  limit_usd: number;
  action_taken: string;
  created_at: number;
}

export interface BudgetCheckResult {
  allowed: boolean;
  current_spend: number;
  limit_usd: number;
  utilization: number; // 0.0-1.0
  warning: boolean;
  policy_id: string | null;
  reason?: string;
}

// ── In-Memory Policy Store ──────────────────────────────────────────

const policies: Map<string, BudgetPolicy> = new Map();
const incidents: BudgetIncident[] = [];
const pausedAgents: Set<string> = new Set();

// ── Model Pricing (USD per 1M tokens) ───────────────────────────────

const MODEL_PRICING: Record<string, { input: number; output: number; cache: number }> = {
  'claude-opus-4-6':    { input: 15.0,  output: 75.0,  cache: 1.875 },
  'claude-sonnet-4-6':  { input: 3.0,   output: 15.0,  cache: 0.375 },
  'claude-haiku-4-5':   { input: 0.80,  output: 4.0,   cache: 0.08 },
  // Fallback for unknown models
  'default':            { input: 3.0,   output: 15.0,  cache: 0.375 },
};

/** Estimate cost in USD from token counts */
export function estimateCost(
  inputTokens: number,
  outputTokens: number,
  cacheTokens = 0,
  model = 'claude-sonnet-4-6',
): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['default']!;
  return (
    (inputTokens / 1_000_000) * pricing.input +
    (outputTokens / 1_000_000) * pricing.output +
    (cacheTokens / 1_000_000) * pricing.cache
  );
}

// ── Policy Management ───────────────────────────────────────────────

/** Create a new budget policy */
export function createBudgetPolicy(
  scope: BudgetScope,
  scopeId: string,
  window: BudgetWindow,
  limitUsd: number,
  options?: { warningThreshold?: number; autoPause?: boolean },
): BudgetPolicy {
  const policy: BudgetPolicy = {
    id: crypto.randomUUID(),
    scope,
    scope_id: scopeId,
    window,
    limit_usd: limitUsd,
    warning_threshold: options?.warningThreshold ?? 0.8,
    auto_pause: options?.autoPause ?? true,
    created_at: Math.floor(Date.now() / 1000),
  };

  policies.set(policy.id, policy);

  logSystemAction(ActionTypes.BUDGET_POLICY_CREATED, 'budget_policy', policy.id, {
    scope,
    scope_id: scopeId,
    window,
    limit_usd: limitUsd,
  });

  // Dual-write to Supabase
  supabaseWrite('budget_policies', { ...policy } as unknown as Record<string, unknown>).catch(() => {});

  logger.info({ policyId: policy.id, scope, scopeId, window, limitUsd }, 'Budget policy created');
  return policy;
}

/** Update an existing budget policy */
export function updateBudgetPolicy(
  policyId: string,
  updates: Partial<Pick<BudgetPolicy, 'limit_usd' | 'warning_threshold' | 'auto_pause'>>,
): BudgetPolicy | null {
  const policy = policies.get(policyId);
  if (!policy) return null;

  if (updates.limit_usd !== undefined) policy.limit_usd = updates.limit_usd;
  if (updates.warning_threshold !== undefined) policy.warning_threshold = updates.warning_threshold;
  if (updates.auto_pause !== undefined) policy.auto_pause = updates.auto_pause;

  policies.set(policyId, policy);

  logSystemAction(ActionTypes.BUDGET_POLICY_UPDATED, 'budget_policy', policyId, updates);

  return policy;
}

/** Delete a budget policy */
export function deleteBudgetPolicy(policyId: string): boolean {
  return policies.delete(policyId);
}

/** Get all policies for an agent */
export function getPoliciesForAgent(agentId: string): BudgetPolicy[] {
  return [...policies.values()].filter(
    (p) => (p.scope === 'agent' && p.scope_id === agentId) || p.scope === 'company',
  );
}

/** Get all policies */
export function getAllPolicies(): BudgetPolicy[] {
  return [...policies.values()];
}

// ── Budget Checking ─────────────────────────────────────────────────

/**
 * Get the start timestamp for a budget window.
 */
function getWindowStart(window: BudgetWindow): number {
  const now = Math.floor(Date.now() / 1000);
  switch (window) {
    case 'daily': {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return Math.floor(d.getTime() / 1000);
    }
    case 'monthly': {
      const d = new Date();
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return Math.floor(d.getTime() / 1000);
    }
    case 'lifetime':
      return 0;
  }
}

// ── DB Integration (set via registerBudgetDb to avoid circular imports) ──

type SpendQueryFn = (agentId: string, windowSeconds: number) => number;
type PolicyQueryFn = () => unknown[];

let _getSpend: SpendQueryFn | null = null;
let _getPoliciesFromDb: PolicyQueryFn | null = null;

/** Register database query functions (called from index.ts after db init) */
export function registerBudgetDb(fns: {
  getSpend: SpendQueryFn;
  getPolicies?: PolicyQueryFn;
}): void {
  _getSpend = fns.getSpend;
  if (fns.getPolicies) _getPoliciesFromDb = fns.getPolicies;
}

/**
 * Get current spend for an agent within a time window.
 * Queries heartbeat_runs via registered db function.
 */
function getCurrentSpend(agentId: string, windowStart: number): number {
  if (!_getSpend) return 0;
  try {
    const windowSeconds = Math.floor(Date.now() / 1000) - windowStart;
    return _getSpend(agentId, windowSeconds);
  } catch {
    return 0;
  }
}

/**
 * Check if an agent is within budget. Call this before every agent run.
 *
 * Returns a BudgetCheckResult indicating whether the run is allowed,
 * current utilization, and any warnings.
 */
export function checkBudget(agentId: string): BudgetCheckResult {
  // If agent is paused due to budget, reject immediately
  if (pausedAgents.has(agentId)) {
    return {
      allowed: false,
      current_spend: 0,
      limit_usd: 0,
      utilization: 1.0,
      warning: true,
      policy_id: null,
      reason: 'Agent is paused due to budget limit',
    };
  }

  const agentPolicies = getPoliciesForAgent(agentId);
  if (agentPolicies.length === 0) {
    // No policies = no limits = always allowed
    return {
      allowed: true,
      current_spend: 0,
      limit_usd: Infinity,
      utilization: 0,
      warning: false,
      policy_id: null,
    };
  }

  // Check each policy -- the most restrictive one wins
  let mostRestrictive: BudgetCheckResult = {
    allowed: true,
    current_spend: 0,
    limit_usd: Infinity,
    utilization: 0,
    warning: false,
    policy_id: null,
  };

  for (const policy of agentPolicies) {
    const windowStart = getWindowStart(policy.window);
    const currentSpend = getCurrentSpend(agentId, windowStart);
    const utilization = policy.limit_usd > 0 ? currentSpend / policy.limit_usd : 0;
    const warning = utilization >= policy.warning_threshold;
    const exceeded = utilization >= 1.0;

    if (exceeded) {
      // Log incident
      const incident: BudgetIncident = {
        id: crypto.randomUUID(),
        policy_id: policy.id,
        agent_id: agentId,
        severity: 'hard_stop',
        current_spend: currentSpend,
        limit_usd: policy.limit_usd,
        action_taken: policy.auto_pause ? 'agent_paused' : 'run_blocked',
        created_at: Math.floor(Date.now() / 1000),
      };
      incidents.push(incident);

      if (policy.auto_pause) {
        pausedAgents.add(agentId);
      }

      logSystemAction(ActionTypes.BUDGET_EXCEEDED, 'agent', agentId, {
        policy_id: policy.id,
        current_spend: currentSpend,
        limit_usd: policy.limit_usd,
        window: policy.window,
      });

      // Dual-write incident
      supabaseWrite('budget_incidents', { ...incident } as unknown as Record<string, unknown>).catch(() => {});

      logger.warn(
        { agentId, policyId: policy.id, currentSpend, limit: policy.limit_usd, window: policy.window },
        'Budget exceeded -- agent blocked',
      );

      return {
        allowed: false,
        current_spend: currentSpend,
        limit_usd: policy.limit_usd,
        utilization,
        warning: true,
        policy_id: policy.id,
        reason: `${policy.window} budget exceeded: $${currentSpend.toFixed(2)} / $${policy.limit_usd.toFixed(2)}`,
      };
    }

    if (warning && utilization > mostRestrictive.utilization) {
      // Log warning incident (only once per check cycle)
      const incident: BudgetIncident = {
        id: crypto.randomUUID(),
        policy_id: policy.id,
        agent_id: agentId,
        severity: 'warning',
        current_spend: currentSpend,
        limit_usd: policy.limit_usd,
        action_taken: 'warning_logged',
        created_at: Math.floor(Date.now() / 1000),
      };
      incidents.push(incident);

      logSystemAction(ActionTypes.BUDGET_WARNING, 'agent', agentId, {
        policy_id: policy.id,
        current_spend: currentSpend,
        limit_usd: policy.limit_usd,
        utilization,
        window: policy.window,
      });

      supabaseWrite('budget_incidents', { ...incident } as unknown as Record<string, unknown>).catch(() => {});

      mostRestrictive = {
        allowed: true,
        current_spend: currentSpend,
        limit_usd: policy.limit_usd,
        utilization,
        warning: true,
        policy_id: policy.id,
      };
    } else if (utilization > mostRestrictive.utilization) {
      mostRestrictive = {
        allowed: true,
        current_spend: currentSpend,
        limit_usd: policy.limit_usd,
        utilization,
        warning: false,
        policy_id: policy.id,
      };
    }
  }

  return mostRestrictive;
}

// ── Agent Pause/Resume ──────────────────────────────────────────────

/** Manually pause an agent's budget */
export function pauseAgent(agentId: string): void {
  pausedAgents.add(agentId);
  logSystemAction(ActionTypes.AGENT_PAUSED, 'agent', agentId, { reason: 'manual' });
  logger.info({ agentId }, 'Agent budget paused manually');
}

/** Resume a paused agent */
export function resumeAgent(agentId: string): void {
  pausedAgents.delete(agentId);
  logSystemAction(ActionTypes.AGENT_RESUMED, 'agent', agentId, { reason: 'manual' });
  logger.info({ agentId }, 'Agent budget resumed');
}

/** Check if an agent is paused */
export function isAgentPaused(agentId: string): boolean {
  return pausedAgents.has(agentId);
}

/** Get all paused agents */
export function getPausedAgents(): string[] {
  return [...pausedAgents];
}

// ── Query Functions ─────────────────────────────────────────────────

/** Get recent budget incidents */
export function getRecentIncidents(limit = 50): BudgetIncident[] {
  return [...incidents].reverse().slice(0, limit);
}

/** Get incidents for a specific agent */
export function getIncidentsForAgent(agentId: string, limit = 20): BudgetIncident[] {
  return [...incidents]
    .reverse()
    .filter((i) => i.agent_id === agentId)
    .slice(0, limit);
}

/** Get budget summary for an agent */
export function getAgentBudgetSummary(agentId: string): {
  policies: BudgetPolicy[];
  current_spend_daily: number;
  current_spend_monthly: number;
  is_paused: boolean;
  recent_incidents: BudgetIncident[];
} {
  const agentPolicies = getPoliciesForAgent(agentId);
  const dailyStart = getWindowStart('daily');
  const monthlyStart = getWindowStart('monthly');

  return {
    policies: agentPolicies,
    current_spend_daily: getCurrentSpend(agentId, dailyStart),
    current_spend_monthly: getCurrentSpend(agentId, monthlyStart),
    is_paused: pausedAgents.has(agentId),
    recent_incidents: getIncidentsForAgent(agentId, 5),
  };
}

// ── Initialize Default Policies ─────────────────────────────────────

/**
 * Load budget policies from the database or create defaults.
 * Called at startup.
 */
export function initBudgetPolicies(): void {
  if (!_getPoliciesFromDb) return;
  try {
    const saved = _getPoliciesFromDb() as BudgetPolicy[];
    for (const p of saved) {
      policies.set(p.id, p);
    }
    if (saved.length > 0) {
      logger.info({ count: saved.length }, 'Loaded budget policies from database');
    }
  } catch {
    // db not initialized yet, that's OK
  }
}
