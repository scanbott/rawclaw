/**
 * Activity Audit Log for Raw Claw v2
 *
 * Immutable audit trail for all agent mutations. Every significant
 * action writes to the activity_log table: actor, action_type,
 * entity_type, entity_id, detail JSON, timestamp.
 *
 * Dual-writes to Supabase when configured.
 */

import crypto from 'crypto';

import { logger } from './logger.js';
import { AGENT_ID } from './config.js';
import { supabaseWrite } from './supabase.js';

// ── Types ───────────────────────────────────────────────────────────

export type ActorType = 'user' | 'agent' | 'system';

export interface ActivityEntry {
  id: string;
  actor_type: ActorType;
  actor_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  detail: Record<string, unknown>;
  created_at: number;
}

// ── In-memory buffer (for dashboard queries before SQLite integration) ──

const MAX_BUFFER_SIZE = 1000;
const activityBuffer: ActivityEntry[] = [];

// ── Core Logging Function ───────────────────────────────────────────

/**
 * Log an activity event to the audit trail.
 *
 * @param actorType - 'user', 'agent', or 'system'
 * @param actorId - The specific user or agent ID
 * @param actionType - What happened (e.g., 'message.sent', 'task.created', 'budget.warning')
 * @param entityType - What was affected (e.g., 'message', 'task', 'agent', 'memory')
 * @param entityId - ID of the affected entity
 * @param detail - Additional context as key-value pairs
 */
export function logActivity(
  actorType: ActorType,
  actorId: string,
  actionType: string,
  entityType: string,
  entityId: string,
  detail: Record<string, unknown> = {},
): void {
  const entry: ActivityEntry = {
    id: crypto.randomUUID(),
    actor_type: actorType,
    actor_id: actorId,
    action_type: actionType,
    entity_type: entityType,
    entity_id: entityId,
    detail,
    created_at: Math.floor(Date.now() / 1000),
  };

  // Buffer in memory
  activityBuffer.push(entry);
  if (activityBuffer.length > MAX_BUFFER_SIZE) {
    activityBuffer.shift();
  }

  // SQLite write happens via the buffer -- dashboard.ts reads from buffer.
  // Direct db.ts integration is done via initAuditDb() to avoid circular imports.

  // Dual-write to Supabase (fire-and-forget)
  supabaseWrite('activity_log', {
    id: entry.id,
    actor_type: entry.actor_type,
    actor_id: entry.actor_id,
    action_type: entry.action_type,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id,
    detail: JSON.stringify(entry.detail),
    created_at: entry.created_at,
  }).catch(() => {}); // Swallow -- Supabase failure must not break local ops
}

// ── Convenience Wrappers ────────────────────────────────────────────

/** Log a user-initiated action */
export function logUserAction(
  actionType: string,
  entityType: string,
  entityId: string,
  detail: Record<string, unknown> = {},
): void {
  logActivity('user', 'owner', actionType, entityType, entityId, detail);
}

/** Log an agent-initiated action */
export function logAgentAction(
  actionType: string,
  entityType: string,
  entityId: string,
  detail: Record<string, unknown> = {},
  agentId?: string,
): void {
  logActivity('agent', agentId || AGENT_ID, actionType, entityType, entityId, detail);
}

/** Log a system-initiated action */
export function logSystemAction(
  actionType: string,
  entityType: string,
  entityId: string,
  detail: Record<string, unknown> = {},
): void {
  logActivity('system', 'rawclaw', actionType, entityType, entityId, detail);
}

// ── Query Functions ─────────────────────────────────────────────────

/** Get recent activity entries from the in-memory buffer */
export function getRecentActivity(limit = 50, offset = 0): ActivityEntry[] {
  const sorted = [...activityBuffer].reverse();
  return sorted.slice(offset, offset + limit);
}

/** Get activity entries filtered by entity type */
export function getActivityByEntity(entityType: string, limit = 50): ActivityEntry[] {
  return [...activityBuffer]
    .reverse()
    .filter((e) => e.entity_type === entityType)
    .slice(0, limit);
}

/** Get activity entries filtered by actor */
export function getActivityByActor(actorId: string, limit = 50): ActivityEntry[] {
  return [...activityBuffer]
    .reverse()
    .filter((e) => e.actor_id === actorId)
    .slice(0, limit);
}

/** Get activity count */
export function getActivityCount(): number {
  return activityBuffer.length;
}

// ── Standard Action Types ───────────────────────────────────────────

export const ActionTypes = {
  // Message events
  MESSAGE_RECEIVED: 'message.received',
  MESSAGE_SENT: 'message.sent',

  // Agent events
  AGENT_STARTED: 'agent.started',
  AGENT_COMPLETED: 'agent.completed',
  AGENT_FAILED: 'agent.failed',
  AGENT_PAUSED: 'agent.paused',
  AGENT_RESUMED: 'agent.resumed',
  AGENT_CREATED: 'agent.created',
  AGENT_DELETED: 'agent.deleted',

  // Task events
  TASK_CREATED: 'task.created',
  TASK_COMPLETED: 'task.completed',
  TASK_FAILED: 'task.failed',
  TASK_CANCELLED: 'task.cancelled',

  // Memory events
  MEMORY_CREATED: 'memory.created',
  MEMORY_PINNED: 'memory.pinned',
  MEMORY_UNPINNED: 'memory.unpinned',
  MEMORY_CONSOLIDATED: 'memory.consolidated',
  MEMORY_DECAYED: 'memory.decayed',

  // Budget events
  BUDGET_WARNING: 'budget.warning',
  BUDGET_EXCEEDED: 'budget.exceeded',
  BUDGET_POLICY_CREATED: 'budget.policy_created',
  BUDGET_POLICY_UPDATED: 'budget.policy_updated',

  // Security events
  SECURITY_LOCKED: 'security.locked',
  SECURITY_UNLOCKED: 'security.unlocked',
  SECURITY_KILL: 'security.kill',
  SECURITY_BLOCKED: 'security.blocked',

  // Delegation events
  DELEGATION_SENT: 'delegation.sent',
  DELEGATION_COMPLETED: 'delegation.completed',

  // Session events
  SESSION_STARTED: 'session.started',
  SESSION_COMPACTED: 'session.compacted',
  SESSION_ROTATED: 'session.rotated',

  // System events
  SYSTEM_STARTUP: 'system.startup',
  SYSTEM_SHUTDOWN: 'system.shutdown',
  SYSTEM_HEALTH_CHECK: 'system.health_check',
  SYSTEM_ERROR: 'system.error',
} as const;
