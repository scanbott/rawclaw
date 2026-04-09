/**
 * Approval Gate System for Raw Claw v2
 *
 * Human-in-the-loop for risky agent actions. An agent hits an approval
 * check before performing sensitive operations. The request is stored in
 * SQLite, a notification is sent to Telegram/Discord, and the agent
 * awaits resolution.
 *
 * Gap #10 from RAW-CLAW-V3-SYNTHESIS.md.
 */

import crypto from 'crypto';
import { logger } from './logger.js';
import { getDb } from './db.js';
import { logAgentAction } from './audit.js';

// ── Types ────────────────────────────────────────────────────────────

export type ApprovalActionType =
  | 'send_email'
  | 'post_content'
  | 'spend_over_threshold'
  | 'external_api_write'
  | 'create_agent';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface ApprovalRequest {
  id: string;
  agent_id: string;
  action_type: ApprovalActionType;
  description: string;
  payload: Record<string, unknown>;
  status: ApprovalStatus;
  reviewer: string | null;
  reviewer_note: string | null;
  created_at: number;
  resolved_at: number | null;
}

export interface ApprovalConfig {
  action_type: ApprovalActionType;
  requires_approval: boolean;
  auto_approve_after_minutes: number | null;
}

// ── Default Config ───────────────────────────────────────────────────

const DEFAULT_CONFIGS: ApprovalConfig[] = [
  { action_type: 'send_email',            requires_approval: true,  auto_approve_after_minutes: null },
  { action_type: 'post_content',          requires_approval: true,  auto_approve_after_minutes: null },
  { action_type: 'spend_over_threshold',  requires_approval: true,  auto_approve_after_minutes: null },
  { action_type: 'external_api_write',    requires_approval: true,  auto_approve_after_minutes: null },
  { action_type: 'create_agent',          requires_approval: true,  auto_approve_after_minutes: null },
];

// ── Notification callback (set by bot.ts after startup) ──────────────

type NotifyFn = (message: string) => Promise<void>;
let _notifyFn: NotifyFn | null = null;

export function setApprovalNotifier(fn: NotifyFn): void {
  _notifyFn = fn;
}

async function sendNotification(message: string): Promise<void> {
  if (_notifyFn) {
    await _notifyFn(message).catch((err) =>
      logger.warn({ err }, 'Approval notification failed'),
    );
  } else {
    logger.info({ message }, 'Approval notification (no notifier set)');
  }
}

// ── Schema ───────────────────────────────────────────────────────────

export function createApprovalSchema(database: ReturnType<typeof getDb>): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS approval_requests (
      id              TEXT PRIMARY KEY,
      agent_id        TEXT NOT NULL DEFAULT 'main',
      action_type     TEXT NOT NULL,
      description     TEXT NOT NULL,
      payload         TEXT NOT NULL DEFAULT '{}',
      status          TEXT NOT NULL DEFAULT 'pending',
      reviewer        TEXT,
      reviewer_note   TEXT,
      created_at      INTEGER NOT NULL,
      resolved_at     INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_approvals_status
      ON approval_requests(status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_approvals_agent
      ON approval_requests(agent_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS approval_config (
      action_type               TEXT PRIMARY KEY,
      requires_approval         INTEGER NOT NULL DEFAULT 1,
      auto_approve_after_minutes INTEGER
    );
  `);

  // Seed default config rows (INSERT OR IGNORE so they're not overwritten by restarts)
  const insert = database.prepare(`
    INSERT OR IGNORE INTO approval_config
      (action_type, requires_approval, auto_approve_after_minutes)
    VALUES (?, ?, ?)
  `);
  for (const cfg of DEFAULT_CONFIGS) {
    insert.run(cfg.action_type, cfg.requires_approval ? 1 : 0, cfg.auto_approve_after_minutes ?? null);
  }
}

// ── DB Helpers ────────────────────────────────────────────────────────

function row2request(row: Record<string, unknown>): ApprovalRequest {
  return {
    id:            row.id as string,
    agent_id:      row.agent_id as string,
    action_type:   row.action_type as ApprovalActionType,
    description:   row.description as string,
    payload:       JSON.parse((row.payload as string) || '{}'),
    status:        row.status as ApprovalStatus,
    reviewer:      (row.reviewer as string | null) ?? null,
    reviewer_note: (row.reviewer_note as string | null) ?? null,
    created_at:    row.created_at as number,
    resolved_at:   (row.resolved_at as number | null) ?? null,
  };
}

export function getApprovalRequest(id: string): ApprovalRequest | null {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM approval_requests WHERE id = ?')
    .get(id) as Record<string, unknown> | undefined;
  return row ? row2request(row) : null;
}

export function listApprovalRequests(
  status?: ApprovalStatus,
  limit = 50,
  offset = 0,
): ApprovalRequest[] {
  const db = getDb();
  let rows: Record<string, unknown>[];
  if (status) {
    rows = db
      .prepare(
        'SELECT * FROM approval_requests WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      )
      .all(status, limit, offset) as Record<string, unknown>[];
  } else {
    rows = db
      .prepare(
        'SELECT * FROM approval_requests ORDER BY created_at DESC LIMIT ? OFFSET ?',
      )
      .all(limit, offset) as Record<string, unknown>[];
  }
  return rows.map(row2request);
}

export function getPendingApprovals(): ApprovalRequest[] {
  return listApprovalRequests('pending');
}

function resolveApproval(
  id: string,
  status: 'approved' | 'rejected',
  reviewer: string,
  reviewerNote: string | null,
): boolean {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const result = db
    .prepare(
      `UPDATE approval_requests
         SET status = ?, reviewer = ?, reviewer_note = ?, resolved_at = ?
       WHERE id = ? AND status = 'pending'`,
    )
    .run(status, reviewer, reviewerNote, now, id);
  return (result.changes ?? 0) > 0;
}

export function approveRequest(
  id: string,
  reviewer = 'owner',
  note: string | null = null,
): boolean {
  const ok = resolveApproval(id, 'approved', reviewer, note);
  if (ok) {
    logAgentAction('approval.approved', 'approval', id, { reviewer, note });
    logger.info({ id, reviewer }, 'Approval request approved');
  }
  return ok;
}

export function rejectRequest(
  id: string,
  reason: string,
  reviewer = 'owner',
): boolean {
  const ok = resolveApproval(id, 'rejected', reviewer, reason);
  if (ok) {
    logAgentAction('approval.rejected', 'approval', id, { reviewer, reason });
    logger.info({ id, reviewer, reason }, 'Approval request rejected');
  }
  return ok;
}

// ── Config Helpers ────────────────────────────────────────────────────

export function getApprovalConfig(actionType: ApprovalActionType): ApprovalConfig | null {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM approval_config WHERE action_type = ?')
    .get(actionType) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    action_type: row.action_type as ApprovalActionType,
    requires_approval: (row.requires_approval as number) === 1,
    auto_approve_after_minutes:
      row.auto_approve_after_minutes != null
        ? (row.auto_approve_after_minutes as number)
        : null,
  };
}

export function updateApprovalConfig(
  actionType: ApprovalActionType,
  requiresApproval: boolean,
  autoApproveAfterMinutes: number | null,
): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO approval_config (action_type, requires_approval, auto_approve_after_minutes)
     VALUES (?, ?, ?)
     ON CONFLICT(action_type) DO UPDATE SET
       requires_approval = excluded.requires_approval,
       auto_approve_after_minutes = excluded.auto_approve_after_minutes`,
  ).run(actionType, requiresApproval ? 1 : 0, autoApproveAfterMinutes ?? null);
}

export function listApprovalConfigs(): ApprovalConfig[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM approval_config').all() as Record<string, unknown>[];
  return rows.map((row) => ({
    action_type: row.action_type as ApprovalActionType,
    requires_approval: (row.requires_approval as number) === 1,
    auto_approve_after_minutes:
      row.auto_approve_after_minutes != null
        ? (row.auto_approve_after_minutes as number)
        : null,
  }));
}

// ── Core Gate Logic ───────────────────────────────────────────────────

/**
 * Result of requestApproval().
 *
 * - approved:  proceed immediately (action bypasses approval or was auto-approved)
 * - pending:   request created and notification sent; caller should await or return
 * - rejected:  blocked — caller should not proceed
 */
export type ApprovalResult =
  | { outcome: 'approved'; requestId: null }
  | { outcome: 'pending';  requestId: string }
  | { outcome: 'rejected'; requestId: string; reason: string };

/**
 * Request approval for a sensitive action.
 *
 * Returns immediately with the outcome. For 'pending' results the caller
 * must NOT proceed — it should surface the requestId to the user and halt.
 *
 * @param agentId     - ID of the requesting agent
 * @param actionType  - One of the five sensitive action types
 * @param description - Human-readable summary shown in the notification
 * @param payload     - Full action payload stored for audit / context
 */
export async function requestApproval(
  agentId: string,
  actionType: ApprovalActionType,
  description: string,
  payload: Record<string, unknown> = {},
): Promise<ApprovalResult> {
  const config = getApprovalConfig(actionType);

  // Config missing or approval disabled — pass through
  if (!config || !config.requires_approval) {
    return { outcome: 'approved', requestId: null };
  }

  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  const db = getDb();
  db.prepare(
    `INSERT INTO approval_requests
       (id, agent_id, action_type, description, payload, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
  ).run(id, agentId, actionType, description, JSON.stringify(payload), now);

  logAgentAction('approval.requested', 'approval', id, {
    action_type: actionType,
    description,
  }, agentId);

  logger.info({ id, agentId, actionType }, 'Approval requested');

  // Send notification
  const actionLabel = ACTION_LABELS[actionType] ?? actionType;
  const shortId = id.slice(0, 8);
  const notifyMsg =
    `Approval required [${shortId}]\n` +
    `Agent: ${agentId}\n` +
    `Action: ${actionLabel}\n` +
    `Details: ${description}\n\n` +
    `/approve ${id} [optional note]\n` +
    `/reject ${id} <reason>`;

  await sendNotification(notifyMsg);

  // Schedule auto-approve if configured
  if (config.auto_approve_after_minutes != null && config.auto_approve_after_minutes > 0) {
    const delayMs = config.auto_approve_after_minutes * 60 * 1000;
    setTimeout(() => {
      const req = getApprovalRequest(id);
      if (req && req.status === 'pending') {
        approveRequest(id, 'auto', `Auto-approved after ${config.auto_approve_after_minutes} minutes`);
        sendNotification(
          `Approval [${shortId}] auto-approved after ${config.auto_approve_after_minutes} minutes.`,
        ).catch(() => {});
      }
    }, delayMs);
  }

  return { outcome: 'pending', requestId: id };
}

/**
 * Poll until an approval request is resolved (approved or rejected).
 * Returns the resolved request, or null on timeout.
 *
 * @param requestId  - The UUID from requestApproval()
 * @param timeoutMs  - Max time to wait (default 30 minutes)
 * @param intervalMs - Poll interval (default 5 seconds)
 */
export async function waitForApproval(
  requestId: string,
  timeoutMs = 30 * 60 * 1000,
  intervalMs = 5000,
): Promise<ApprovalRequest | null> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const req = getApprovalRequest(requestId);
    if (!req) return null;
    if (req.status !== 'pending') return req;
    await sleep(intervalMs);
  }

  // Expire the request if still pending
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  db.prepare(
    `UPDATE approval_requests SET status = 'expired', resolved_at = ?
     WHERE id = ? AND status = 'pending'`,
  ).run(now, requestId);

  logger.warn({ requestId }, 'Approval request timed out and expired');
  return getApprovalRequest(requestId);
}

// ── Labels & Utils ────────────────────────────────────────────────────

const ACTION_LABELS: Record<ApprovalActionType, string> = {
  send_email:           'Send email',
  post_content:         'Post to social media',
  spend_over_threshold: 'API spend over threshold ($5)',
  external_api_write:   'External API write (POST/PUT/DELETE)',
  create_agent:         'Create new sub-agent',
};

export function getActionLabel(actionType: ApprovalActionType): string {
  return ACTION_LABELS[actionType] ?? actionType;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Auto-expire daemon ────────────────────────────────────────────────
// Runs once per hour and marks pending requests as expired if
// they have exceeded 24 hours without a response.

let _expireDaemon: ReturnType<typeof setInterval> | null = null;

export function startApprovalExpireDaemon(maxAgeHours = 24): void {
  if (_expireDaemon) return;

  function expire(): void {
    try {
      const db = getDb();
      const cutoff = Math.floor(Date.now() / 1000) - maxAgeHours * 3600;
      const now = Math.floor(Date.now() / 1000);
      const result = db
        .prepare(
          `UPDATE approval_requests SET status = 'expired', resolved_at = ?
           WHERE status = 'pending' AND created_at < ?`,
        )
        .run(now, cutoff);
      if ((result.changes ?? 0) > 0) {
        logger.info({ expired: result.changes }, 'Expired stale approval requests');
      }
    } catch (err) {
      logger.warn({ err }, 'Approval expire daemon error');
    }
  }

  // Run once on startup, then hourly
  expire();
  _expireDaemon = setInterval(expire, 60 * 60 * 1000);
}
