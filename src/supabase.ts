/**
 * Supabase Client Integration for Raw Claw v2
 *
 * Provides optional Supabase connectivity for cloud persistence,
 * cross-machine memory sync, and multi-tenant data isolation.
 * SQLite remains primary -- Supabase is a dual-write target.
 */

import { readEnvFile } from './env.js';
import { logger } from './logger.js';

// ── Configuration ───────────────────────────────────────────────────

const envConfig = readEnvFile([
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_ANON_KEY',
  'COMPANY_ID',
]);

export const SUPABASE_URL =
  process.env.SUPABASE_URL || envConfig.SUPABASE_URL || '';
export const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY || envConfig.SUPABASE_SERVICE_KEY || '';
export const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || envConfig.SUPABASE_ANON_KEY || '';
export const COMPANY_ID =
  process.env.COMPANY_ID || envConfig.COMPANY_ID || '';

/** Whether Supabase is configured and available */
export const supabaseEnabled = !!(SUPABASE_URL && (SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY));

// ── Lightweight Supabase REST Client ────────────────────────────────
// We avoid importing @supabase/supabase-js to keep dependencies minimal.
// Instead, we use the PostgREST API directly via fetch().

interface SupabaseQueryResult<T = Record<string, unknown>> {
  data: T[] | null;
  error: { message: string; code?: string } | null;
  count?: number;
}

class SupabaseClient {
  private url: string;
  private apiKey: string;
  private headers: Record<string, string>;

  constructor(url: string, apiKey: string) {
    this.url = url.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.headers = {
      'apikey': apiKey,
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    };
  }

  /** POST (insert) rows into a table */
  async insert<T = Record<string, unknown>>(
    table: string,
    rows: Record<string, unknown> | Record<string, unknown>[],
  ): Promise<SupabaseQueryResult<T>> {
    try {
      const resp = await fetch(`${this.url}/rest/v1/${table}`, {
        method: 'POST',
        headers: { ...this.headers, 'Prefer': 'return=representation' },
        body: JSON.stringify(Array.isArray(rows) ? rows : [rows]),
      });
      if (!resp.ok) {
        const err = await resp.text();
        return { data: null, error: { message: err, code: String(resp.status) } };
      }
      const data = await resp.json() as T[];
      return { data, error: null };
    } catch (e) {
      return { data: null, error: { message: String(e) } };
    }
  }

  /** PATCH (update) rows matching filters */
  async update<T = Record<string, unknown>>(
    table: string,
    values: Record<string, unknown>,
    filters: string,
  ): Promise<SupabaseQueryResult<T>> {
    try {
      const resp = await fetch(`${this.url}/rest/v1/${table}?${filters}`, {
        method: 'PATCH',
        headers: { ...this.headers, 'Prefer': 'return=representation' },
        body: JSON.stringify(values),
      });
      if (!resp.ok) {
        const err = await resp.text();
        return { data: null, error: { message: err, code: String(resp.status) } };
      }
      const data = await resp.json() as T[];
      return { data, error: null };
    } catch (e) {
      return { data: null, error: { message: String(e) } };
    }
  }

  /** GET (select) rows from a table with optional PostgREST query params */
  async select<T = Record<string, unknown>>(
    table: string,
    query = '',
    options?: { count?: boolean },
  ): Promise<SupabaseQueryResult<T>> {
    try {
      const headers = { ...this.headers };
      if (options?.count) {
        headers['Prefer'] = 'count=exact';
      }
      const sep = query ? '?' : '';
      const resp = await fetch(`${this.url}/rest/v1/${table}${sep}${query}`, {
        method: 'GET',
        headers,
      });
      if (!resp.ok) {
        const err = await resp.text();
        return { data: null, error: { message: err, code: String(resp.status) } };
      }
      const data = await resp.json() as T[];
      const countHeader = resp.headers.get('content-range');
      const count = countHeader ? parseInt(countHeader.split('/')[1] || '0', 10) : undefined;
      return { data, error: null, count };
    } catch (e) {
      return { data: null, error: { message: String(e) } };
    }
  }

  /** DELETE rows matching filters */
  async delete(table: string, filters: string): Promise<SupabaseQueryResult> {
    try {
      const resp = await fetch(`${this.url}/rest/v1/${table}?${filters}`, {
        method: 'DELETE',
        headers: this.headers,
      });
      if (!resp.ok) {
        const err = await resp.text();
        return { data: null, error: { message: err, code: String(resp.status) } };
      }
      return { data: [], error: null };
    } catch (e) {
      return { data: null, error: { message: String(e) } };
    }
  }

  /** RPC (call a Postgres function) */
  async rpc<T = unknown>(
    fn: string,
    params: Record<string, unknown> = {},
  ): Promise<{ data: T | null; error: { message: string } | null }> {
    try {
      const resp = await fetch(`${this.url}/rest/v1/rpc/${fn}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(params),
      });
      if (!resp.ok) {
        const err = await resp.text();
        return { data: null, error: { message: err } };
      }
      const data = await resp.json() as T;
      return { data, error: null };
    } catch (e) {
      return { data: null, error: { message: String(e) } };
    }
  }

  /** Health check -- test connection by hitting the REST endpoint */
  async healthCheck(): Promise<boolean> {
    try {
      const resp = await fetch(`${this.url}/rest/v1/`, {
        method: 'GET',
        headers: { 'apikey': this.apiKey },
      });
      return resp.ok;
    } catch {
      return false;
    }
  }
}

// ── Singleton Client ────────────────────────────────────────────────

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseEnabled) return null;
  if (!_client) {
    const key = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;
    _client = new SupabaseClient(SUPABASE_URL, key);
    logger.info({ url: SUPABASE_URL }, 'Supabase client initialized');
  }
  return _client;
}

// ── Dual-Write Helper ───────────────────────────────────────────────

/**
 * Write data to Supabase (fire-and-forget). SQLite is always primary.
 * Logs errors but never throws -- Supabase failures must not break local ops.
 */
export async function supabaseWrite(
  table: string,
  data: Record<string, unknown>,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  // Inject company_id if configured
  const row = COMPANY_ID ? { company_id: COMPANY_ID, ...data } : data;

  try {
    const result = await client.insert(table, row);
    if (result.error) {
      logger.warn({ table, error: result.error.message }, 'Supabase write failed');
    }
  } catch (e) {
    logger.warn({ table, error: String(e) }, 'Supabase write exception');
  }
}

/**
 * Update data in Supabase (fire-and-forget).
 */
export async function supabaseUpdate(
  table: string,
  values: Record<string, unknown>,
  filters: string,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    const result = await client.update(table, values, filters);
    if (result.error) {
      logger.warn({ table, error: result.error.message }, 'Supabase update failed');
    }
  } catch (e) {
    logger.warn({ table, error: String(e) }, 'Supabase update exception');
  }
}

/**
 * Read data from Supabase.
 */
export async function supabaseRead<T = Record<string, unknown>>(
  table: string,
  query = '',
): Promise<T[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const result = await client.select<T>(table, query);
    if (result.error) {
      logger.warn({ table, error: result.error.message }, 'Supabase read failed');
      return null;
    }
    return result.data;
  } catch (e) {
    logger.warn({ table, error: String(e) }, 'Supabase read exception');
    return null;
  }
}

// ── Types for Cloud Tables ──────────────────────────────────────────

export interface HeartbeatRunRow {
  id: string;
  company_id?: string;
  agent_id: string;
  invocation_source: 'timer' | 'assignment' | 'on_demand' | 'mission' | 'delegation';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
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
  started_at: number;
  completed_at: number | null;
}

export interface BudgetPolicyRow {
  id: string;
  company_id?: string;
  scope: 'agent' | 'company';
  scope_id: string;
  window: 'daily' | 'monthly' | 'lifetime';
  limit_usd: number;
  warning_threshold: number;
  auto_pause: boolean;
  created_at: number;
}

export interface BudgetIncidentRow {
  id: string;
  company_id?: string;
  policy_id: string;
  agent_id: string;
  severity: 'warning' | 'hard_stop';
  current_spend: number;
  limit_usd: number;
  action_taken: string;
  created_at: number;
}

export interface ActivityLogRow {
  id: string;
  company_id?: string;
  actor_type: 'user' | 'agent' | 'system';
  actor_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  detail: string;
  created_at: number;
}

export interface HiveMindRow {
  id?: number;
  company_id?: string;
  agent_id: string;
  chat_id: string;
  action: string;
  summary: string;
  artifacts: string | null;
  created_at: number;
}
