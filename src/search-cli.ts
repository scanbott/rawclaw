/**
 * search-cli.ts — Standalone CLI for FTS5 conversation search.
 *
 * Usage: node dist/search-cli.js "query terms" [--agent main] [--limit 10] [--days 30]
 *
 * The agent can invoke this via Bash to search across all past conversations.
 * Returns formatted results with ranked matches, snippets, and timestamps.
 */

import { initDatabase, searchConversationFTS } from './db.js';
import { ALLOWED_CHAT_ID } from './config.js';

function parseArgs(args: string[]): { query: string; agent?: string; limit: number; days?: number } {
  let query = '';
  let agent: string | undefined;
  let limit = 10;
  let days: number | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--agent' && args[i + 1]) {
      agent = args[++i];
    } else if (arg === '--limit' && args[i + 1]) {
      limit = parseInt(args[++i], 10) || 10;
    } else if (arg === '--days' && args[i + 1]) {
      days = parseInt(args[++i], 10) || undefined;
    } else if (!arg.startsWith('--')) {
      query = arg;
    }
  }

  return { query, agent, limit, days };
}

function formatTimestamp(unix: number): string {
  return new Date(unix * 1000).toISOString().replace('T', ' ').slice(0, 19);
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 3) + '...';
}

function main(): void {
  const { query, agent, limit, days } = parseArgs(process.argv.slice(2));

  if (!query) {
    console.log('Usage: search-cli "query terms" [--agent main] [--limit 10] [--days 30]');
    process.exit(1);
  }

  initDatabase();

  const chatId = ALLOWED_CHAT_ID;
  if (!chatId) {
    console.error('Error: ALLOWED_CHAT_ID not set');
    process.exit(1);
  }

  const results = searchConversationFTS(chatId, query, agent, limit, days);

  if (results.length === 0) {
    console.log(`No results found for: "${query}"`);
    return;
  }

  console.log(`\n── Search Results for "${query}" (${results.length} matches) ──\n`);

  for (const r of results) {
    const time = formatTimestamp(r.created_at);
    const role = r.role === 'user' ? 'USER' : 'ASSISTANT';
    const agentLabel = r.agent_id !== 'main' ? ` [${r.agent_id}]` : '';

    console.log(`[${time}] ${role}${agentLabel}`);
    console.log(`  Snippet: ${r.snippet}`);

    if (r.context_before) {
      console.log(`  Context before (${r.context_before.role}): ${truncate(r.context_before.content, 120)}`);
    }
    if (r.context_after) {
      console.log(`  Context after (${r.context_after.role}): ${truncate(r.context_after.content, 120)}`);
    }

    console.log('');
  }
}

main();
