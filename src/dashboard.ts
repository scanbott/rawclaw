import { Api, RawApi } from 'grammy';
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { serve } from '@hono/node-server';

import fs from 'fs';
import path from 'path';
import { AGENT_ID, ALLOWED_CHAT_ID, DASHBOARD_PORT, DASHBOARD_TOKEN, PROJECT_ROOT, STORE_DIR, WHATSAPP_ENABLED, SLACK_USER_TOKEN, CONTEXT_LIMIT, agentDefaultModel } from './config.js';
import crypto from 'crypto';
import {
  getAllScheduledTasks,
  deleteScheduledTask,
  pauseScheduledTask,
  resumeScheduledTask,
  getConversationPage,
  getDashboardMemoryStats,
  getDashboardPinnedMemories,
  getDashboardLowSalienceMemories,
  getDashboardTopAccessedMemories,
  getDashboardMemoryTimeline,
  getDashboardConsolidations,
  getDashboardMemoriesList,
  getDashboardTokenStats,
  getDashboardCostTimeline,
  getDashboardRecentTokenUsage,
  getSession,
  getSessionTokenUsage,
  getHiveMindEntries,
  getAgentTokenStats,
  getAgentRecentConversation,
  getMissionTasks,
  getMissionTask,
  createMissionTask,
  cancelMissionTask,
  deleteMissionTask,
  reassignMissionTask,
  assignMissionTask,
  getUnassignedMissionTasks,
  getMissionTaskHistory,
  getAuditLog,
  getAuditLogCount,
  getRecentBlockedActions,
  getDbTables,
  getDbTableNames,
  getDbTableRows,
  runReadOnlyQuery,
  decryptField,
} from './db.js';
import { generateContent, parseJsonResponse } from './gemini.js';
import { getSecurityStatus } from './security.js';
import { listAgentIds, loadAgentConfig, setAgentModel } from './agent-config.js';
import {
  listTemplates,
  validateAgentId,
  validateBotToken,
  createAgent,
  activateAgent,
  deactivateAgent,
  deleteAgent,
  suggestBotNames,
  isAgentRunning,
} from './agent-create.js';
import { processMessageFromDashboard } from './bot.js';
import { getDashboardHtml } from './dashboard-html.js';
import {
  getLifeOSHubHtml,
  getLifeOSSellingHtml,
  getLifeOSRecruitingHtml,
  getLifeOSBrandHtml,
  getLifeOSPersonalHtml,
  getLifeOSAgentsHtml,
} from './lifeos-html.js';
import { logger } from './logger.js';
import { getTelegramConnected, getBotInfo, chatEvents, getIsProcessing, abortActiveQuery, ChatEvent } from './state.js';

async function classifyTaskAgent(prompt: string): Promise<string | null> {
  try {
    const agentIds = listAgentIds();
    const agentDescriptions = agentIds.map((id) => {
      try {
        const config = loadAgentConfig(id);
        return `- ${id}: ${config.description}`;
      } catch { return `- ${id}: (no description)`; }
    });

    const classificationPrompt = `Given these agents and their roles:
- main: Primary assistant, general tasks, anything that doesn't clearly fit another agent
${agentDescriptions.join('\n')}

Which ONE agent is best suited for this task?
Task: "${prompt.slice(0, 500)}"

Reply with JSON: {"agent": "agent_id"}`;

    const response = await generateContent(classificationPrompt);
    const parsed = parseJsonResponse<{ agent: string }>(response);
    if (parsed?.agent) {
      const validAgents = ['main', ...agentIds];
      if (validAgents.includes(parsed.agent)) return parsed.agent;
    }
    return 'main'; // fallback
  } catch (err) {
    logger.error({ err }, 'Auto-assign classification failed');
    return null;
  }
}

export function startDashboard(botApi?: Api<RawApi>): void {
  if (!DASHBOARD_TOKEN) {
    logger.info('DASHBOARD_TOKEN not set, dashboard disabled');
    return;
  }

  const app = new Hono();

  // In-memory session store (maps session ID -> { authed: true, created: timestamp })
  const sessions = new Map<string, { authed: boolean; created: number }>();

  function generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  function parseCookies(header: string | undefined): Record<string, string> {
    if (!header) return {};
    return Object.fromEntries(header.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    }));
  }

  function isAuthenticated(c: any): boolean {
    const cookies = parseCookies(c.req.header('cookie'));
    const sid = cookies['rawclaw_session'];
    if (!sid) return false;
    const session = sessions.get(sid);
    if (!session || !session.authed) return false;
    // Sessions expire after 24 hours
    if (Date.now() - session.created > 24 * 60 * 60 * 1000) {
      sessions.delete(sid);
      return false;
    }
    return true;
  }

  // CORS headers for cross-origin access (Cloudflare tunnel, mobile browsers)
  app.use('*', async (c, next) => {
    c.header('Access-Control-Allow-Origin', c.req.header('origin') || '*');
    c.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, PATCH, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type');
    c.header('Access-Control-Allow-Credentials', 'true');
    if (c.req.method === 'OPTIONS') return c.body(null, 204);
    await next();
  });

  // Global error handler — prevents unhandled throws from killing the server
  app.onError((err, c) => {
    logger.error({ err: err.message }, 'Dashboard request error');
    return c.json({ error: 'Internal server error' }, 500);
  });

  // ── Login endpoint (no auth required) ──────────────────────────────────
  app.post('/api/login', async (c) => {
    const body = await c.req.json<{ password?: string }>().catch(() => ({ password: '' }));
    const password = (body as any)?.password?.trim() || '';
    if (!password || password !== DASHBOARD_TOKEN) {
      return c.json({ error: 'Invalid password' }, 401);
    }
    const sid = generateSessionId();
    sessions.set(sid, { authed: true, created: Date.now() });
    c.header('Set-Cookie', `rawclaw_session=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);
    return c.json({ ok: true });
  });

  // ── Logout endpoint ────────────────────────────────────────────────────
  app.post('/api/logout', (c) => {
    const cookies = parseCookies(c.req.header('cookie'));
    const sid = cookies['rawclaw_session'];
    if (sid) sessions.delete(sid);
    c.header('Set-Cookie', 'rawclaw_session=; Path=/; HttpOnly; Max-Age=0');
    return c.json({ ok: true });
  });

  // ── Auth check endpoint (no auth required) ─────────────────────────────
  app.get('/api/auth-check', (c) => {
    return c.json({ authenticated: isAuthenticated(c) });
  });

  // ── Auth middleware — everything below requires session cookie ──────────
  // Allow: /health (no auth), /api/login, /api/logout, /api/auth-check, GET / (serves login page)
  app.use('*', async (c, next) => {
    const path = c.req.path;
    // Public routes
    if (path === '/api/login' || path === '/api/logout' || path === '/api/auth-check' || path === '/health') {
      return next();
    }
    // Serve dashboard/Life OS pages (includes login screen) — always accessible
    const publicPages = ['/', '/selling', '/recruiting', '/brand', '/personal', '/agents', '/ai'];
    if (publicPages.includes(path) && c.req.method === 'GET') {
      return next();
    }
    // Also support legacy ?token= in URL for backward compat (but token is NOT exposed in HTML anymore)
    const urlToken = c.req.query('token');
    if (urlToken && urlToken === DASHBOARD_TOKEN) {
      return next();
    }
    // Check session cookie
    if (!isAuthenticated(c)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    await next();
  });

  // Life OS hub (root page)
  app.get('/', (c) => c.html(getLifeOSHubHtml()));
  app.get('/selling', (c) => c.html(getLifeOSSellingHtml()));
  app.get('/recruiting', (c) => c.html(getLifeOSRecruitingHtml()));
  app.get('/brand', (c) => c.html(getLifeOSBrandHtml()));
  app.get('/personal', (c) => c.html(getLifeOSPersonalHtml()));
  app.get('/agents', (c) => c.html(getLifeOSAgentsHtml()));

  // Original rawclaw AI dashboard (moved to /ai)
  app.get('/ai', (c) => {
    const chatId = c.req.query('chatId') || '';
    return c.html(getDashboardHtml('', chatId));
  });

  // Scheduled tasks
  app.get('/api/tasks', (c) => {
    const tasks = getAllScheduledTasks();
    return c.json({ tasks });
  });

  // Delete a scheduled task
  app.delete('/api/tasks/:id', (c) => {
    const id = c.req.param('id');
    deleteScheduledTask(id);
    return c.json({ ok: true });
  });

  // Pause a scheduled task
  app.post('/api/tasks/:id/pause', (c) => {
    const id = c.req.param('id');
    pauseScheduledTask(id);
    return c.json({ ok: true });
  });

  // Resume a scheduled task
  app.post('/api/tasks/:id/resume', (c) => {
    const id = c.req.param('id');
    resumeScheduledTask(id);
    return c.json({ ok: true });
  });

  // ── Mission Control endpoints ────────────────────────────────────────

  app.get('/api/mission/tasks', (c) => {
    const agentId = c.req.query('agent') || undefined;
    const status = c.req.query('status') || undefined;
    const tasks = getMissionTasks(agentId, status);
    return c.json({ tasks });
  });

  app.get('/api/mission/tasks/:id', (c) => {
    const id = c.req.param('id');
    const task = getMissionTask(id);
    if (!task) return c.json({ error: 'Not found' }, 404);
    return c.json({ task });
  });

  app.post('/api/mission/tasks', async (c) => {
    const body = await c.req.json<{
      title?: string;
      prompt?: string;
      assigned_agent?: string;
      priority?: number;
    }>();

    const title = body?.title?.trim();
    const prompt = body?.prompt?.trim();
    const assignedAgent = body?.assigned_agent?.trim() || null;
    const priority = Math.max(0, Math.min(10, body?.priority ?? 0));

    if (!title || title.length > 200) return c.json({ error: 'title required (max 200 chars)' }, 400);
    if (!prompt || prompt.length > 10000) return c.json({ error: 'prompt required (max 10000 chars)' }, 400);

    // Validate agent if provided
    if (assignedAgent) {
      const validAgents = ['main', ...listAgentIds()];
      if (!validAgents.includes(assignedAgent)) {
        return c.json({ error: `Unknown agent: ${assignedAgent}. Valid: ${validAgents.join(', ')}` }, 400);
      }
    }

    const id = crypto.randomBytes(4).toString('hex');
    createMissionTask(id, title, prompt, assignedAgent, 'dashboard', priority);

    const task = getMissionTask(id);
    return c.json({ task }, 201);
  });

  app.post('/api/mission/tasks/:id/cancel', (c) => {
    const id = c.req.param('id');
    const ok = cancelMissionTask(id);
    return c.json({ ok });
  });

  // Auto-assign a single task via Gemini classification
  app.post('/api/mission/tasks/:id/auto-assign', async (c) => {
    const id = c.req.param('id');
    const task = getMissionTask(id);
    if (!task) return c.json({ error: 'Not found' }, 404);
    if (task.assigned_agent) return c.json({ error: 'Already assigned' }, 400);

    const agent = await classifyTaskAgent(task.prompt);
    if (!agent) return c.json({ error: 'Classification failed' }, 500);

    assignMissionTask(id, agent);
    return c.json({ ok: true, assigned_agent: agent });
  });

  // Auto-assign all unassigned tasks
  app.post('/api/mission/tasks/auto-assign-all', async (c) => {
    const tasks = getUnassignedMissionTasks();
    if (tasks.length === 0) return c.json({ assigned: 0 });

    const results: Array<{ id: string; agent: string }> = [];
    for (const task of tasks) {
      const agent = await classifyTaskAgent(task.prompt);
      if (agent && assignMissionTask(task.id, agent)) {
        results.push({ id: task.id, agent });
      }
    }
    return c.json({ assigned: results.length, results });
  });

  app.patch('/api/mission/tasks/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json<{ assigned_agent?: string }>();
    const newAgent = body?.assigned_agent?.trim();
    if (!newAgent) return c.json({ error: 'assigned_agent required' }, 400);
    const validAgents = ['main', ...listAgentIds()];
    if (!validAgents.includes(newAgent)) return c.json({ error: 'Unknown agent' }, 400);
    const ok = reassignMissionTask(id, newAgent);
    return c.json({ ok });
  });

  app.delete('/api/mission/tasks/:id', (c) => {
    const id = c.req.param('id');
    const ok = deleteMissionTask(id);
    return c.json({ ok });
  });

  app.get('/api/mission/history', (c) => {
    const limit = parseInt(c.req.query('limit') || '30', 10);
    const offset = parseInt(c.req.query('offset') || '0', 10);
    return c.json(getMissionTaskHistory(limit, offset));
  });

  // Memory stats
  app.get('/api/memories', (c) => {
    const chatId = c.req.query('chatId') || '';
    const stats = getDashboardMemoryStats(chatId);
    const fading = getDashboardLowSalienceMemories(chatId, 10);
    const topAccessed = getDashboardTopAccessedMemories(chatId, 5);
    const timeline = getDashboardMemoryTimeline(chatId, 30);
    const consolidations = getDashboardConsolidations(chatId, 5);
    return c.json({ stats, fading, topAccessed, timeline, consolidations });
  });

  // Memory list (for drill-down drawer)
  app.get('/api/memories/pinned', (c) => {
    const chatId = c.req.query('chatId') || '';
    const memories = getDashboardPinnedMemories(chatId);
    return c.json({ memories });
  });

  app.get('/api/memories/list', (c) => {
    const chatId = c.req.query('chatId') || '';
    const limit = parseInt(c.req.query('limit') || '50', 10);
    const offset = parseInt(c.req.query('offset') || '0', 10);
    const sortBy = (c.req.query('sort') || 'importance') as 'importance' | 'salience' | 'recent';
    const result = getDashboardMemoriesList(chatId, limit, offset, sortBy);
    return c.json(result);
  });

  // System health
  app.get('/api/health', (c) => {
    const chatId = c.req.query('chatId') || '';
    const sessionId = getSession(chatId);
    let contextPct = 0;
    let turns = 0;
    let compactions = 0;
    let sessionAge = '-';

    if (sessionId) {
      const summary = getSessionTokenUsage(sessionId);
      if (summary) {
        turns = summary.turns;
        compactions = summary.compactions;
        const contextTokens = (summary.lastContextTokens || 0) + (summary.lastCacheRead || 0);
        contextPct = contextTokens > 0 ? Math.round((contextTokens / CONTEXT_LIMIT) * 100) : 0;
        const ageSec = Math.floor(Date.now() / 1000) - summary.firstTurnAt;
        if (ageSec < 3600) sessionAge = Math.floor(ageSec / 60) + 'm';
        else if (ageSec < 86400) sessionAge = Math.floor(ageSec / 3600) + 'h';
        else sessionAge = Math.floor(ageSec / 86400) + 'd';
      }
    }

    return c.json({
      contextPct,
      turns,
      compactions,
      sessionAge,
      model: agentDefaultModel || 'sonnet-4-6',
      telegramConnected: getTelegramConnected(),
      waConnected: WHATSAPP_ENABLED,
      slackConnected: !!SLACK_USER_TOKEN,
    });
  });

  // Token / cost stats
  app.get('/api/tokens', (c) => {
    const chatId = c.req.query('chatId') || '';
    const stats = getDashboardTokenStats(chatId);
    const costTimeline = getDashboardCostTimeline(chatId, 30);
    const recentUsage = getDashboardRecentTokenUsage(chatId, 20);
    return c.json({ stats, costTimeline, recentUsage });
  });

  // Bot info (name, PID, chatId) — reads dynamically from state
  app.get('/api/info', (c) => {
    const chatId = c.req.query('chatId') || '';
    const info = getBotInfo();
    return c.json({
      botName: info.name || 'RawClaw',
      botUsername: info.username || '',
      pid: process.pid,
      chatId: chatId || null,
    });
  });

  // ── Agent endpoints ──────────────────────────────────────────────────

  // List all configured agents with status
  app.get('/api/agents', (c) => {
    const agentIds = listAgentIds();
    const agents = agentIds.map((id) => {
      try {
        const config = loadAgentConfig(id);
        // Check if agent process is alive via PID file
        const pidFile = path.join(STORE_DIR, `agent-${id}.pid`);
        let running = false;
        if (fs.existsSync(pidFile)) {
          try {
            const pid = parseInt(fs.readFileSync(pidFile, 'utf-8').trim(), 10);
            process.kill(pid, 0); // signal 0 = check if alive
            running = true;
          } catch { /* process not running */ }
        }
        const stats = getAgentTokenStats(id);
        return {
          id,
          name: config.name,
          description: config.description,
          model: config.model ?? 'claude-opus-4-6',
          running,
          todayTurns: stats.todayTurns,
          todayCost: stats.todayCost,
        };
      } catch {
        return { id, name: id, description: '', model: 'unknown', running: false, todayTurns: 0, todayCost: 0 };
      }
    });

    // Include main bot too
    const mainPidFile = path.join(STORE_DIR, 'rawclaw.pid');
    let mainRunning = false;
    if (fs.existsSync(mainPidFile)) {
      try {
        const pid = parseInt(fs.readFileSync(mainPidFile, 'utf-8').trim(), 10);
        process.kill(pid, 0);
        mainRunning = true;
      } catch { /* not running */ }
    }
    const mainStats = getAgentTokenStats('main');
    const allAgents = [
      { id: 'main', name: 'Main', description: 'Primary RawClaw bot', model: 'claude-opus-4-6', running: mainRunning, todayTurns: mainStats.todayTurns, todayCost: mainStats.todayCost },
      ...agents,
    ];

    return c.json({ agents: allAgents });
  });

  // Agent-specific recent conversation
  app.get('/api/agents/:id/conversation', (c) => {
    const agentId = c.req.param('id');
    const chatId = c.req.query('chatId') || ALLOWED_CHAT_ID || '';
    const limit = parseInt(c.req.query('limit') || '4', 10);
    const turns = getAgentRecentConversation(agentId, chatId, limit);
    return c.json({ turns });
  });

  // Agent-specific tasks
  app.get('/api/agents/:id/tasks', (c) => {
    const agentId = c.req.param('id');
    const tasks = getAllScheduledTasks(agentId);
    return c.json({ tasks });
  });

  // Agent-specific token stats
  app.get('/api/agents/:id/tokens', (c) => {
    const agentId = c.req.param('id');
    const stats = getAgentTokenStats(agentId);
    return c.json(stats);
  });

  // Update agent model
  app.patch('/api/agents/:id/model', async (c) => {
    const agentId = c.req.param('id');
    const body = await c.req.json<{ model?: string }>();
    const model = body?.model?.trim();
    if (!model) return c.json({ error: 'model required' }, 400);

    const validModels = ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-sonnet-4-5', 'claude-haiku-4-5'];
    if (!validModels.includes(model)) return c.json({ error: `Invalid model. Valid: ${validModels.join(', ')}` }, 400);

    try {
      if (agentId === 'main') {
        // Main agent uses in-memory override (same as /model command)
        const { setMainModelOverride } = await import('./bot.js');
        setMainModelOverride(model);
      } else {
        setAgentModel(agentId, model);
      }
      return c.json({ ok: true, agent: agentId, model });
    } catch (err) {
      return c.json({ error: 'Failed to update model' }, 500);
    }
  });

  // Update ALL agent models at once
  app.patch('/api/agents/model', async (c) => {
    const body = await c.req.json<{ model?: string }>();
    const model = body?.model?.trim();
    if (!model) return c.json({ error: 'model required' }, 400);

    const validModels = ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-sonnet-4-5', 'claude-haiku-4-5'];
    if (!validModels.includes(model)) return c.json({ error: `Invalid model` }, 400);

    const agentIds = listAgentIds();
    const updated: string[] = [];
    for (const id of agentIds) {
      try { setAgentModel(id, model); updated.push(id); } catch {}
    }
    return c.json({ ok: true, model, updated });
  });

  // ── Agent Creation & Management ──────────────────────────────────────

  // List available agent templates
  app.get('/api/agents/templates', (c) => {
    return c.json({ templates: listTemplates() });
  });

  // Validate an agent ID (before creation)
  app.get('/api/agents/validate-id', (c) => {
    const id = c.req.query('id') || '';
    const result = validateAgentId(id);
    const suggestions = id ? suggestBotNames(id) : null;
    return c.json({ ...result, suggestions });
  });

  // Validate a bot token
  app.post('/api/agents/validate-token', async (c) => {
    const body = await c.req.json<{ token?: string }>();
    const token = body?.token?.trim();
    if (!token) return c.json({ ok: false, error: 'token required' }, 400);
    const result = await validateBotToken(token);
    return c.json(result);
  });

  // Create a new agent
  app.post('/api/agents/create', async (c) => {
    const body = await c.req.json<{
      id?: string;
      name?: string;
      description?: string;
      model?: string;
      template?: string;
      botToken?: string;
    }>();

    const id = body?.id?.trim();
    const name = body?.name?.trim();
    const description = body?.description?.trim();
    const botToken = body?.botToken?.trim();

    if (!id) return c.json({ error: 'id required' }, 400);
    if (!name) return c.json({ error: 'name required' }, 400);
    if (!description) return c.json({ error: 'description required' }, 400);
    if (!botToken) return c.json({ error: 'botToken required' }, 400);

    try {
      const result = await createAgent({
        id,
        name,
        description,
        model: body?.model?.trim() || undefined,
        template: body?.template?.trim() || undefined,
        botToken,
      });
      return c.json({ ok: true, ...result }, 201);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return c.json({ error: msg }, 400);
    }
  });

  // Activate an agent (install service + start)
  app.post('/api/agents/:id/activate', (c) => {
    const agentId = c.req.param('id');
    if (agentId === 'main') return c.json({ error: 'Cannot activate main via this endpoint' }, 400);
    const result = activateAgent(agentId);
    return c.json(result);
  });

  // Deactivate an agent (stop + uninstall service)
  app.post('/api/agents/:id/deactivate', (c) => {
    const agentId = c.req.param('id');
    if (agentId === 'main') return c.json({ error: 'Cannot deactivate main via this endpoint' }, 400);
    const result = deactivateAgent(agentId);
    return c.json(result);
  });

  // Delete an agent entirely
  app.delete('/api/agents/:id/full', (c) => {
    const agentId = c.req.param('id');
    if (agentId === 'main') return c.json({ error: 'Cannot delete main' }, 400);
    const result = deleteAgent(agentId);
    if (result.ok) {
      return c.json({ ok: true });
    }
    return c.json({ error: result.error }, 500);
  });

  // Check if a specific agent is running
  app.get('/api/agents/:id/status', (c) => {
    const agentId = c.req.param('id');
    return c.json({ running: isAgentRunning(agentId) });
  });

  // ── Security & Audit ─────────────────────────────────────────────────

  app.get('/api/security/status', (c) => {
    return c.json(getSecurityStatus());
  });

  app.get('/api/audit', (c) => {
    const limit = parseInt(c.req.query('limit') || '50', 10);
    const offset = parseInt(c.req.query('offset') || '0', 10);
    const agentId = c.req.query('agent') || undefined;
    const entries = getAuditLog(limit, offset, agentId);
    const total = getAuditLogCount(agentId);
    return c.json({ entries, total });
  });

  app.get('/api/audit/blocked', (c) => {
    const limit = parseInt(c.req.query('limit') || '10', 10);
    return c.json({ entries: getRecentBlockedActions(limit) });
  });

  // Hive mind feed
  app.get('/api/hive-mind', (c) => {
    const agentId = c.req.query('agent');
    const limit = parseInt(c.req.query('limit') || '20', 10);
    const entries = getHiveMindEntries(limit, agentId || undefined);
    return c.json({ entries });
  });

  // ── Database Explorer endpoints ────────────────────────────────────

  // List all tables with row counts and column info
  app.get('/api/db/tables', (c) => {
    const tables = getDbTables();
    return c.json({ tables });
  });

  // Get paginated rows from a table
  app.get('/api/db/tables/:name', (c) => {
    const tableName = c.req.param('name');
    // Validate table name against actual tables to prevent SQL injection
    const validTables = getDbTableNames();
    if (!validTables.includes(tableName)) {
      return c.json({ error: 'Unknown table' }, 400);
    }

    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '50', 10)));
    const sort = c.req.query('sort') || undefined;
    const order = (c.req.query('order') || 'asc') as 'asc' | 'desc';

    const result = getDbTableRows(tableName, page, limit, sort, order);

    // Attempt decryption on encrypted fields
    const encryptedFields: Record<string, string[]> = {
      wa_messages: ['body'],
      slack_messages: ['body'],
    };
    const fieldsToDecrypt = encryptedFields[tableName];
    if (fieldsToDecrypt) {
      result.rows = result.rows.map((row) => {
        const decrypted = { ...row };
        for (const field of fieldsToDecrypt) {
          if (typeof decrypted[field] === 'string') {
            try {
              decrypted[field] = decryptField(decrypted[field] as string);
            } catch { /* leave as-is */ }
          }
        }
        return decrypted;
      });
    }

    return c.json(result);
  });

  // Run a read-only SQL query
  app.get('/api/db/query', (c) => {
    const sql = (c.req.query('sql') || '').trim();
    if (!sql) return c.json({ error: 'sql parameter required' }, 400);

    // Only allow SELECT statements
    if (!/^select\b/i.test(sql)) {
      return c.json({ error: 'Only SELECT queries are allowed' }, 400);
    }

    // Block dangerous patterns
    if (/;\s*(drop|delete|update|insert|alter|create|attach|detach|pragma)/i.test(sql)) {
      return c.json({ error: 'Only single SELECT queries are allowed' }, 400);
    }

    try {
      const result = runReadOnlyQuery(sql + (sql.toLowerCase().includes(' limit ') ? '' : ' LIMIT 1000'));
      if (result.rowCount > 1000) {
        result.rows = result.rows.slice(0, 1000);
        result.rowCount = 1000;
      }
      return c.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return c.json({ error: msg }, 400);
    }
  });

  // ── Supabase Explorer endpoints ──────────────────────────────────────

  // List all Supabase tables
  app.get('/api/supabase/tables', async (c) => {
    const { supabaseEnabled, SUPABASE_URL, SUPABASE_SERVICE_KEY } = await import('./supabase.js');
    if (!supabaseEnabled) return c.json({ error: 'Supabase not configured' }, 400);

    try {
      // The PostgREST root returns an OpenAPI spec -- parse paths for table names
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY || '',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY || ''}`,
        },
      });
      if (!resp.ok) return c.json({ error: 'Failed to list tables' }, 500);
      const spec = await resp.json() as { paths?: Record<string, unknown> };
      const paths = spec.paths || {};
      const tables = Object.keys(paths)
        .filter(p => !p.startsWith('/rpc/'))
        .map(p => p.replace(/^\//, ''))
        .filter(Boolean)
        .map(name => ({ name, type: 'supabase' }));
      return c.json({ tables });
    } catch (e) {
      return c.json({ error: String(e) }, 500);
    }
  });

  // Get rows from a Supabase table
  app.get('/api/supabase/tables/:name', async (c) => {
    const { supabaseEnabled, getSupabaseClient } = await import('./supabase.js');
    if (!supabaseEnabled) return c.json({ error: 'Supabase not configured' }, 400);
    const client = getSupabaseClient();
    if (!client) return c.json({ error: 'Supabase client not available' }, 500);

    const tableName = c.req.param('name');
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '50', 10)));
    const offset = (page - 1) * limit;
    const sort = c.req.query('sort');
    const order = c.req.query('order') === 'desc' ? 'desc' : 'asc';

    const query = `select=*&limit=${limit}&offset=${offset}` +
      (sort ? `&order=${sort}.${order}` : '') +
      '&' ; // trailing & is harmless

    const result = await client.select(tableName, query, { count: true });
    if (result.error) return c.json({ error: result.error.message }, 500);

    const rows = result.data || [];
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return c.json({
      columns,
      rows,
      rowCount: result.count || rows.length,
      page,
      limit,
      totalPages: Math.ceil((result.count || rows.length) / limit),
    });
  });

  // Insert a row into a Supabase table
  app.post('/api/supabase/tables/:name', async (c) => {
    const { supabaseEnabled, getSupabaseClient } = await import('./supabase.js');
    if (!supabaseEnabled) return c.json({ error: 'Supabase not configured' }, 400);
    const client = getSupabaseClient();
    if (!client) return c.json({ error: 'Supabase client not available' }, 500);

    const tableName = c.req.param('name');
    const body = await c.req.json();
    const result = await client.insert(tableName, body);
    if (result.error) return c.json({ error: result.error.message }, 500);
    return c.json({ success: true, data: result.data });
  });

  // ── Chat endpoints ─────────────────────────────────────────────────

  // SSE stream for real-time chat updates
  app.get('/api/chat/stream', (c) => {
    return streamSSE(c, async (stream) => {
      // Send initial processing state
      const state = getIsProcessing();
      await stream.writeSSE({
        event: 'processing',
        data: JSON.stringify({ processing: state.processing, chatId: state.chatId }),
      });

      // Forward chat events to SSE client
      const handler = async (event: ChatEvent) => {
        try {
          await stream.writeSSE({
            event: event.type,
            data: JSON.stringify(event),
          });
        } catch {
          // Client disconnected
        }
      };

      chatEvents.on('chat', handler);

      // Keepalive ping every 30s
      const pingInterval = setInterval(async () => {
        try {
          await stream.writeSSE({ event: 'ping', data: '' });
        } catch {
          clearInterval(pingInterval);
        }
      }, 30_000);

      // Wait until the client disconnects
      try {
        await new Promise<void>((_, reject) => {
          stream.onAbort(() => reject(new Error('aborted')));
        });
      } catch {
        // Expected: client disconnected
      } finally {
        clearInterval(pingInterval);
        chatEvents.off('chat', handler);
      }
    });
  });

  // Chat history (paginated)
  app.get('/api/chat/history', (c) => {
    const chatId = c.req.query('chatId') || '';
    if (!chatId) return c.json({ error: 'chatId required' }, 400);
    const limit = parseInt(c.req.query('limit') || '40', 10);
    const beforeId = c.req.query('beforeId');
    const turns = getConversationPage(chatId, limit, beforeId ? parseInt(beforeId, 10) : undefined);
    return c.json({ turns });
  });

  // Send message from dashboard
  app.post('/api/chat/send', async (c) => {
    if (!botApi) return c.json({ error: 'Bot API not available' }, 503);
    const body = await c.req.json<{ message?: string }>();
    const message = body?.message?.trim();
    if (!message) return c.json({ error: 'message required' }, 400);

    // Fire-and-forget: response comes via SSE
    void processMessageFromDashboard(botApi, message);
    return c.json({ ok: true });
  });

  // Abort current processing
  app.post('/api/chat/abort', (c) => {
    const { chatId } = getIsProcessing();
    if (!chatId) return c.json({ ok: false, reason: 'not_processing' });
    const aborted = abortActiveQuery(chatId);
    return c.json({ ok: aborted });
  });

  // ── v2 Endpoints: Health, Budget, Heartbeat, Audit, Plugins ────────

  // Health check endpoint (no auth required)
  app.get('/health', async (c) => {
    const { getHealthStatus } = await import('./health.js');
    const health = await getHealthStatus();
    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
    return c.json(health, statusCode);
  });

  // Heartbeat runs
  app.get('/api/heartbeat/runs', async (c) => {
    const { getRecentRuns } = await import('./heartbeat.js');
    const limit = parseInt(c.req.query('limit') || '50', 10);
    const agentId = c.req.query('agentId');
    const runs = getRecentRuns(limit, agentId || undefined);
    return c.json({ runs });
  });

  app.get('/api/heartbeat/stats', async (c) => {
    const agentId = c.req.query('agentId') || AGENT_ID;
    const { getAgentStats } = await import('./heartbeat.js');
    const stats = getAgentStats(agentId);
    return c.json(stats);
  });

  app.get('/api/heartbeat/active', async (c) => {
    const { getActiveRuns } = await import('./heartbeat.js');
    return c.json({ runs: getActiveRuns() });
  });

  // Budget endpoints
  app.get('/api/budget/policies', async (c) => {
    const { getAllPolicies } = await import('./budget.js');
    return c.json({ policies: getAllPolicies() });
  });

  app.post('/api/budget/policies', async (c) => {
    const { createBudgetPolicy } = await import('./budget.js');
    const body = await c.req.json<{
      scope: 'agent' | 'company';
      scope_id: string;
      window: 'daily' | 'monthly' | 'lifetime';
      limit_usd: number;
      warning_threshold?: number;
      auto_pause?: boolean;
    }>();
    if (!body.scope || !body.scope_id || !body.window || !body.limit_usd) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    const policy = createBudgetPolicy(body.scope, body.scope_id, body.window, body.limit_usd, {
      warningThreshold: body.warning_threshold,
      autoPause: body.auto_pause,
    });
    return c.json({ policy });
  });

  app.delete('/api/budget/policies/:id', async (c) => {
    const { deleteBudgetPolicy } = await import('./budget.js');
    const deleted = deleteBudgetPolicy(c.req.param('id'));
    return c.json({ ok: deleted });
  });

  app.get('/api/budget/summary/:agentId', async (c) => {
    const { getAgentBudgetSummary } = await import('./budget.js');
    const summary = getAgentBudgetSummary(c.req.param('agentId'));
    return c.json(summary);
  });

  app.get('/api/budget/incidents', async (c) => {
    const { getRecentIncidents } = await import('./budget.js');
    const limit = parseInt(c.req.query('limit') || '50', 10);
    return c.json({ incidents: getRecentIncidents(limit) });
  });

  app.post('/api/budget/pause/:agentId', async (c) => {
    const { pauseAgent } = await import('./budget.js');
    pauseAgent(c.req.param('agentId'));
    return c.json({ ok: true });
  });

  app.post('/api/budget/resume/:agentId', async (c) => {
    const { resumeAgent } = await import('./budget.js');
    resumeAgent(c.req.param('agentId'));
    return c.json({ ok: true });
  });

  // Activity audit log
  app.get('/api/activity', async (c) => {
    const { getRecentActivity } = await import('./audit.js');
    const limit = parseInt(c.req.query('limit') || '50', 10);
    const offset = parseInt(c.req.query('offset') || '0', 10);
    return c.json({ entries: getRecentActivity(limit, offset) });
  });

  app.get('/api/activity/entity/:type', async (c) => {
    const { getActivityByEntity } = await import('./audit.js');
    const limit = parseInt(c.req.query('limit') || '50', 10);
    return c.json({ entries: getActivityByEntity(c.req.param('type'), limit) });
  });

  // Session compaction status
  app.get('/api/sessions/health', async (c) => {
    const { getSessionHealthSummary } = await import('./session-compaction.js');
    return c.json({ sessions: getSessionHealthSummary() });
  });

  app.get('/api/sessions/config', async (c) => {
    const { getCompactionConfig } = await import('./session-compaction.js');
    return c.json(getCompactionConfig());
  });

  // Life OS quick stats
  app.get('/api/stats', async (c) => {
    const { getMemoryCount } = await import('./db.js');
    const { listSkills } = await import('./skill-manage.js');
    const memCount = getMemoryCount();
    const skills = listSkills();
    const tasks = getAllScheduledTasks();
    const uptime = Math.floor(process.uptime());
    return c.json({ memories: memCount, skills: skills.length, tasks: tasks.length, uptimeSeconds: uptime });
  });

  // Plugins
  app.get('/api/plugins', async (c) => {
    const { getPlugins } = await import('./plugins.js');
    return c.json({ plugins: getPlugins() });
  });

  app.get('/api/plugins/tools', async (c) => {
    const { getPluginTools } = await import('./plugins.js');
    return c.json({ tools: getPluginTools() });
  });

  // Discord adapter info
  app.get('/api/discord/status', async (c) => {
    const { discordEnabled, DISCORD_WEBHOOK_URL } = await import('./discord.js');
    return c.json({
      enabled: discordEnabled,
      webhook_configured: !!DISCORD_WEBHOOK_URL,
    });
  });

  // Supabase status
  app.get('/api/supabase/status', async (c) => {
    const { supabaseEnabled, getSupabaseClient } = await import('./supabase.js');
    let connected = false;
    if (supabaseEnabled) {
      const client = getSupabaseClient();
      if (client) {
        connected = await client.healthCheck();
      }
    }
    return c.json({ enabled: supabaseEnabled, connected });
  });

  // ── Skills API (Hermes-inspired) ─────────────────────────────────
  app.get('/api/skills', async (c) => {
    const { listSkills } = await import('./skill-manage.js');
    const { getSkillHistory } = await import('./db.js');
    const skills = listSkills();
    const history = getSkillHistory(undefined, 50);
    return c.json({ skills, history });
  });

  app.delete('/api/skills/:name', async (c) => {
    const { deleteSkill } = await import('./skill-manage.js');
    const { logSkillAction } = await import('./db.js');
    const name = c.req.param('name');
    const success = deleteSkill(name);
    if (success) {
      logSkillAction(name, 'delete', 'dashboard', ALLOWED_CHAT_ID);
    }
    return c.json({ success });
  });

  // ── MCP API ──────────────────────────────────────────────────────
  app.get('/api/mcp/servers', async (c) => {
    const { getMcpServers } = await import('./mcp-config.js');
    return c.json({ servers: getMcpServers() });
  });

  app.post('/api/mcp/servers', async (c) => {
    const { addMcpServer } = await import('./mcp-config.js');
    const config = await c.req.json();
    try {
      addMcpServer(config);
      return c.json({ success: true });
    } catch (err) {
      return c.json({ success: false, error: (err as Error).message }, 400);
    }
  });

  app.delete('/api/mcp/servers/:name', async (c) => {
    const { removeMcpServer } = await import('./mcp-config.js');
    const success = removeMcpServer(c.req.param('name'));
    return c.json({ success });
  });

  app.patch('/api/mcp/servers/:name/toggle', async (c) => {
    const { toggleMcpServer } = await import('./mcp-config.js');
    const body = await c.req.json();
    const success = toggleMcpServer(c.req.param('name'), body.enabled);
    return c.json({ success });
  });

  // ── Conversation Search API ──────────────────────────────────────
  app.get('/api/search', async (c) => {
    const { searchConversationFTS } = await import('./db.js');
    const query = c.req.query('q') ?? '';
    const agent = c.req.query('agent');
    const limit = parseInt(c.req.query('limit') ?? '20');
    const days = c.req.query('days') ? parseInt(c.req.query('days')!) : undefined;
    if (!query) return c.json({ results: [] });
    const results = searchConversationFTS(ALLOWED_CHAT_ID, query, agent, limit, days);
    return c.json({ results });
  });

  const server = serve({ fetch: app.fetch, port: DASHBOARD_PORT }, () => {
    logger.info({ port: DASHBOARD_PORT }, 'Dashboard server running');
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      logger.warn({ port: DASHBOARD_PORT }, 'Dashboard port already in use -- skipping dashboard (kill the other process or change DASHBOARD_PORT in .env)');
    } else {
      logger.error({ err }, 'Dashboard server error');
    }
  });
}
