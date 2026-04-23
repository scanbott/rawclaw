/**
 * mcp-config.ts — MCP server configuration management.
 *
 * Manages MCP server configs in ~/.rawclaw/mcp.yaml and syncs them
 * to Claude Code's ~/.claude/settings.json so the SDK picks them up.
 *
 * Inspired by Hermes Agent's MCP integration, but leverages
 * Claude Code SDK's native MCP support instead of building a custom client.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import yaml from 'js-yaml';

import { logger } from './logger.js';
import { readEnvFile } from './env.js';

export interface McpServerConfig {
  name: string;
  type: 'stdio' | 'http';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  enabled: boolean;
}

const MCP_CONFIG_PATH = path.join(os.homedir(), '.rawclaw', 'mcp.yaml');
const CLAUDE_SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json');

// Allowlisted commands for stdio MCP servers
const ALLOWED_COMMANDS = new Set([
  'npx', 'node', 'python3', 'python', 'bun', 'deno', 'uvx', 'uv',
]);

/**
 * Load MCP server configs from ~/.rawclaw/mcp.yaml
 */
export function getMcpServers(): McpServerConfig[] {
  try {
    if (!fs.existsSync(MCP_CONFIG_PATH)) return [];
    const raw = fs.readFileSync(MCP_CONFIG_PATH, 'utf-8');
    const parsed = yaml.load(raw) as { mcp_servers?: McpServerConfig[] } | null;
    return parsed?.mcp_servers ?? [];
  } catch (err) {
    logger.warn('Failed to load MCP config: %s', (err as Error).message);
    return [];
  }
}

/**
 * Save MCP server configs to ~/.rawclaw/mcp.yaml
 */
function saveMcpConfig(servers: McpServerConfig[]): void {
  const dir = path.dirname(MCP_CONFIG_PATH);
  fs.mkdirSync(dir, { recursive: true });
  const content = yaml.dump({ mcp_servers: servers }, { lineWidth: 120 });
  fs.writeFileSync(MCP_CONFIG_PATH, content, 'utf-8');
}

/**
 * Add a new MCP server configuration.
 */
export function addMcpServer(config: McpServerConfig): void {
  // Validate command
  if (config.type === 'stdio' && config.command) {
    const cmd = path.basename(config.command);
    if (!ALLOWED_COMMANDS.has(cmd)) {
      throw new Error(`Command '${config.command}' not in allowlist. Allowed: ${[...ALLOWED_COMMANDS].join(', ')}`);
    }
  }

  const servers = getMcpServers();
  const existing = servers.findIndex((s) => s.name === config.name);
  if (existing >= 0) {
    servers[existing] = config;
  } else {
    servers.push(config);
  }
  saveMcpConfig(servers);
  logger.info('MCP server added: %s', config.name);
}

/**
 * Remove an MCP server configuration.
 */
export function removeMcpServer(name: string): boolean {
  const servers = getMcpServers();
  const idx = servers.findIndex((s) => s.name === name);
  if (idx < 0) return false;
  servers.splice(idx, 1);
  saveMcpConfig(servers);
  logger.info('MCP server removed: %s', name);
  return true;
}

/**
 * Enable or disable an MCP server.
 */
export function toggleMcpServer(name: string, enabled: boolean): boolean {
  const servers = getMcpServers();
  const server = servers.find((s) => s.name === name);
  if (!server) return false;
  server.enabled = enabled;
  saveMcpConfig(servers);
  logger.info('MCP server %s: %s', enabled ? 'enabled' : 'disabled', name);
  return true;
}

/**
 * Resolve ${VAR} references in env values using rawclaw's .env file.
 * Never reads from process.env directly — only from the .env file.
 */
function resolveEnvVars(env: Record<string, string>): Record<string, string> {
  const envFile = readEnvFile(Object.keys(env).map((k) => {
    const match = env[k].match(/\$\{(\w+)\}/);
    return match ? match[1] : k;
  }));

  const resolved: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    resolved[key] = value.replace(/\$\{(\w+)\}/g, (_, varName) => {
      return (envFile as Record<string, string>)[varName] || '';
    });
  }
  return resolved;
}

/**
 * Sync enabled MCP servers to Claude Code's settings.json.
 * The SDK reads MCP servers from this file and manages connections.
 */
export function syncMcpToClaudeSettings(): void {
  try {
    const servers = getMcpServers().filter((s) => s.enabled);
    if (servers.length === 0) {
      logger.debug('No enabled MCP servers to sync');
      return;
    }

    // Read existing settings
    let settings: Record<string, unknown> = {};
    const claudeDir = path.dirname(CLAUDE_SETTINGS_PATH);
    fs.mkdirSync(claudeDir, { recursive: true });

    if (fs.existsSync(CLAUDE_SETTINGS_PATH)) {
      try {
        settings = JSON.parse(fs.readFileSync(CLAUDE_SETTINGS_PATH, 'utf-8'));
      } catch {
        settings = {};
      }
    }

    // Build MCP servers config for Claude Code
    const mcpServers: Record<string, Record<string, unknown>> = {};
    for (const server of servers) {
      const entry: Record<string, unknown> = {
        type: server.type,
      };

      if (server.command) entry.command = server.command;
      if (server.args) entry.args = server.args;
      if (server.url) entry.url = server.url;
      if (server.env) entry.env = resolveEnvVars(server.env);

      mcpServers[server.name] = entry;
    }

    // Merge into settings (preserve existing non-MCP settings)
    settings.mcpServers = mcpServers;

    // Write back
    fs.writeFileSync(CLAUDE_SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8');
    logger.info('Synced %d MCP server(s) to Claude settings', servers.length);
  } catch (err) {
    logger.warn('Failed to sync MCP settings: %s', (err as Error).message);
  }
}
