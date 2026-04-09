/**
 * Session Compaction for Raw Claw v2
 *
 * Tracks per-agent session health and rotates sessions when they
 * exceed configurable thresholds. Prevents context rot for
 * long-running agents.
 *
 * Thresholds stolen from Paperclip's session-compaction.ts:
 * - maxSessionRuns: 200 runs per session
 * - maxRawInputTokens: 2,000,000 tokens total input
 * - maxSessionAgeHours: 72 hours
 */

import { logger } from './logger.js';
import { logSystemAction, ActionTypes } from './audit.js';

// ── DB Registration (avoids circular imports) ──────────────────────

type ClearSessionFn = (agentId: string) => void;
let _clearSession: ClearSessionFn | null = null;

/** Register db function (called from index.ts after db init) */
export function registerSessionDb(fns: { clearSession: ClearSessionFn }): void {
  _clearSession = fns.clearSession;
}

// ── Types ───────────────────────────────────────────────────────────

export interface SessionCompactionConfig {
  maxSessionRuns: number;
  maxRawInputTokens: number;
  maxSessionAgeHours: number;
}

export interface SessionState {
  agentId: string;
  sessionId: string | null;
  runCount: number;
  totalInputTokens: number;
  sessionStartedAt: number;
  lastRunAt: number;
}

export interface CompactionDecision {
  shouldRotate: boolean;
  reason: string | null;
  currentState: SessionState;
}

// ── Default Configuration ───────────────────────────────────────────

const DEFAULT_CONFIG: SessionCompactionConfig = {
  maxSessionRuns: 200,
  maxRawInputTokens: 2_000_000,
  maxSessionAgeHours: 72,
};

// ── Per-Agent Session State ─────────────────────────────────────────

const sessionStates: Map<string, SessionState> = new Map();
let config: SessionCompactionConfig = { ...DEFAULT_CONFIG };

/** Update compaction config */
export function setCompactionConfig(updates: Partial<SessionCompactionConfig>): void {
  config = { ...config, ...updates };
  logger.info({ config }, 'Session compaction config updated');
}

/** Get current compaction config */
export function getCompactionConfig(): SessionCompactionConfig {
  return { ...config };
}

// ── State Tracking ──────────────────────────────────────────────────

/**
 * Record a run against an agent's session state.
 * Call this after every heartbeat run completes.
 */
export function recordRun(
  agentId: string,
  sessionId: string | null,
  inputTokens: number,
): void {
  const state = sessionStates.get(agentId);

  if (!state || state.sessionId !== sessionId) {
    // New session or session changed
    sessionStates.set(agentId, {
      agentId,
      sessionId,
      runCount: 1,
      totalInputTokens: inputTokens,
      sessionStartedAt: Math.floor(Date.now() / 1000),
      lastRunAt: Math.floor(Date.now() / 1000),
    });
    return;
  }

  // Update existing session state
  state.runCount += 1;
  state.totalInputTokens += inputTokens;
  state.lastRunAt = Math.floor(Date.now() / 1000);
}

/**
 * Check if a session should be rotated based on thresholds.
 */
export function checkCompaction(agentId: string): CompactionDecision {
  const state = sessionStates.get(agentId);
  if (!state) {
    return {
      shouldRotate: false,
      reason: null,
      currentState: {
        agentId,
        sessionId: null,
        runCount: 0,
        totalInputTokens: 0,
        sessionStartedAt: 0,
        lastRunAt: 0,
      },
    };
  }

  // Check run count
  if (state.runCount >= config.maxSessionRuns) {
    return {
      shouldRotate: true,
      reason: `Run count ${state.runCount} exceeds max ${config.maxSessionRuns}`,
      currentState: state,
    };
  }

  // Check total input tokens
  if (state.totalInputTokens >= config.maxRawInputTokens) {
    return {
      shouldRotate: true,
      reason: `Total input tokens ${state.totalInputTokens.toLocaleString()} exceeds max ${config.maxRawInputTokens.toLocaleString()}`,
      currentState: state,
    };
  }

  // Check session age
  const ageHours = (Date.now() / 1000 - state.sessionStartedAt) / 3600;
  if (ageHours >= config.maxSessionAgeHours) {
    return {
      shouldRotate: true,
      reason: `Session age ${ageHours.toFixed(1)}h exceeds max ${config.maxSessionAgeHours}h`,
      currentState: state,
    };
  }

  return {
    shouldRotate: false,
    reason: null,
    currentState: state,
  };
}

/**
 * Rotate (reset) a session. Clears the session state so the next
 * run starts fresh without --resume.
 *
 * Returns the old session ID for handoff summary generation.
 */
export function rotateSession(agentId: string): string | null {
  const state = sessionStates.get(agentId);
  if (!state) return null;

  const oldSessionId = state.sessionId;

  logSystemAction(ActionTypes.SESSION_ROTATED, 'session', agentId, {
    old_session_id: oldSessionId,
    run_count: state.runCount,
    total_input_tokens: state.totalInputTokens,
    session_age_hours: ((Date.now() / 1000 - state.sessionStartedAt) / 3600).toFixed(1),
  });

  logger.info(
    {
      agentId,
      oldSessionId,
      runCount: state.runCount,
      totalInputTokens: state.totalInputTokens,
    },
    'Session rotated',
  );

  // Clear the session state
  sessionStates.delete(agentId);

  // Clear the session in db.ts via registered callback
  if (_clearSession) {
    try { _clearSession(agentId); } catch { /* db not ready */ }
  }

  return oldSessionId;
}

// ── Query Functions ─────────────────────────────────────────────────

/** Get session state for an agent */
export function getSessionState(agentId: string): SessionState | null {
  return sessionStates.get(agentId) || null;
}

/** Get all session states */
export function getAllSessionStates(): SessionState[] {
  return [...sessionStates.values()];
}

/** Get session health summary */
export function getSessionHealthSummary(): Array<{
  agentId: string;
  sessionId: string | null;
  runCount: number;
  tokenUtilization: number;
  ageHours: number;
  needsRotation: boolean;
}> {
  return [...sessionStates.values()].map((state) => {
    const ageHours = (Date.now() / 1000 - state.sessionStartedAt) / 3600;
    const decision = checkCompaction(state.agentId);
    return {
      agentId: state.agentId,
      sessionId: state.sessionId,
      runCount: state.runCount,
      tokenUtilization: state.totalInputTokens / config.maxRawInputTokens,
      ageHours: Math.round(ageHours * 10) / 10,
      needsRotation: decision.shouldRotate,
    };
  });
}
