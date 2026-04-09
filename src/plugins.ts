/**
 * Plugin System for Raw Claw v2
 *
 * In-process TypeScript plugin loader with YAML manifest.
 * Plugins live in plugins/<name>/ with plugin.yaml + index.ts.
 *
 * Simplified from Paperclip's out-of-process JSON-RPC model:
 * plugins are trusted modules running in the main process.
 */

import fs from 'fs';
import path from 'path';

import { logger } from './logger.js';
import { PROJECT_ROOT } from './config.js';
import type {
  PluginManifest,
  PluginInstance,
  PluginEvent,
  PluginStateStore,
} from './plugin-types.js';

// ── Plugin Registry ─────────────────────────────────────────────────

const plugins: Map<string, PluginInstance> = new Map();
const eventSubscriptions: Map<string, Set<string>> = new Map(); // eventType -> pluginIds

// ── State Store (in-memory, persisted to SQLite on shutdown) ────────

const stateStore: Map<string, Record<string, unknown>> = new Map();

const pluginStateStore: PluginStateStore = {
  get(pluginId: string, key: string): unknown {
    return stateStore.get(pluginId)?.[key];
  },
  set(pluginId: string, key: string, value: unknown): void {
    const state = stateStore.get(pluginId) || {};
    state[key] = value;
    stateStore.set(pluginId, state);
  },
  delete(pluginId: string, key: string): void {
    const state = stateStore.get(pluginId);
    if (state) delete state[key];
  },
  getAll(pluginId: string): Record<string, unknown> {
    return stateStore.get(pluginId) || {};
  },
};

// ── Plugin Loading ──────────────────────────────────────────────────

/**
 * Discover and load all plugins from the plugins/ directory.
 */
export async function loadPlugins(): Promise<void> {
  const pluginsDir = path.join(PROJECT_ROOT, 'plugins');
  if (!fs.existsSync(pluginsDir)) {
    logger.info('No plugins directory found -- skipping plugin loading');
    return;
  }

  const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;

    try {
      await loadPlugin(path.join(pluginsDir, entry.name));
    } catch (e) {
      logger.error({ plugin: entry.name, error: String(e) }, 'Failed to load plugin');
    }
  }

  logger.info({ count: plugins.size }, 'Plugins loaded');
}

/**
 * Load a single plugin from its directory.
 */
async function loadPlugin(pluginDir: string): Promise<void> {
  // Read manifest
  const manifestPath = path.join(pluginDir, 'plugin.yaml');
  const manifestJsonPath = path.join(pluginDir, 'plugin.json');

  let manifest: PluginManifest;

  if (fs.existsSync(manifestPath)) {
    // Dynamic import js-yaml
    const yaml = await import('js-yaml');
    const raw = fs.readFileSync(manifestPath, 'utf-8');
    manifest = yaml.load(raw) as PluginManifest;
  } else if (fs.existsSync(manifestJsonPath)) {
    const raw = fs.readFileSync(manifestJsonPath, 'utf-8');
    manifest = JSON.parse(raw) as PluginManifest;
  } else {
    logger.warn({ dir: pluginDir }, 'No plugin.yaml or plugin.json found -- skipping');
    return;
  }

  // Validate manifest
  if (!manifest.id || !manifest.name || !manifest.version) {
    logger.warn({ dir: pluginDir }, 'Invalid plugin manifest (missing id, name, or version)');
    return;
  }

  // Check for duplicate
  if (plugins.has(manifest.id)) {
    logger.warn({ pluginId: manifest.id }, 'Duplicate plugin ID -- skipping');
    return;
  }

  // Load the plugin module
  const entryPoint = path.join(pluginDir, 'dist', 'index.js');
  const entryPointTs = path.join(pluginDir, 'index.ts'); // Dev mode

  let pluginModule: Record<string, unknown> | undefined;

  if (fs.existsSync(entryPoint)) {
    pluginModule = await import(`file://${entryPoint}`);
  } else if (fs.existsSync(entryPointTs)) {
    // In dev mode, tsx can import .ts directly
    try {
      pluginModule = await import(`file://${entryPointTs}`);
    } catch {
      logger.warn({ pluginId: manifest.id }, 'Cannot load .ts plugin without tsx -- build first');
    }
  }

  // Create plugin instance
  const instance: PluginInstance = {
    manifest,
    status: 'loaded',
    init: pluginModule?.init as PluginInstance['init'],
    shutdown: pluginModule?.shutdown as PluginInstance['shutdown'],
    onEvent: pluginModule?.onEvent as PluginInstance['onEvent'],
    onToolCall: pluginModule?.onToolCall as PluginInstance['onToolCall'],
    getState: (key: string) => pluginStateStore.get(manifest.id, key),
    setState: (key: string, value: unknown) => pluginStateStore.set(manifest.id, key, value),
  };

  // Register event subscriptions
  if (manifest.events) {
    for (const eventType of manifest.events) {
      if (!eventSubscriptions.has(eventType)) {
        eventSubscriptions.set(eventType, new Set());
      }
      eventSubscriptions.get(eventType)!.add(manifest.id);
    }
  }

  plugins.set(manifest.id, instance);

  // Initialize the plugin
  try {
    if (instance.init) {
      await instance.init();
    }
    instance.status = 'active';
    logger.info({ pluginId: manifest.id, version: manifest.version }, 'Plugin loaded and initialized');
  } catch (e) {
    instance.status = 'error';
    instance.error = String(e);
    logger.error({ pluginId: manifest.id, error: String(e) }, 'Plugin init failed');
  }
}

// ── Event Dispatch ──────────────────────────────────────────────────

/**
 * Dispatch an event to all subscribed plugins.
 * Fire-and-forget: plugin errors are logged but don't propagate.
 */
export async function dispatchEvent(event: PluginEvent): Promise<void> {
  const subscribers = eventSubscriptions.get(event.type);
  if (!subscribers || subscribers.size === 0) return;

  const promises: Promise<void>[] = [];
  for (const pluginId of subscribers) {
    const plugin = plugins.get(pluginId);
    if (!plugin || plugin.status !== 'active' || !plugin.onEvent) continue;

    promises.push(
      plugin.onEvent(event).catch((e) => {
        logger.warn({ pluginId, event: event.type, error: String(e) }, 'Plugin event handler failed');
      }),
    );
  }

  await Promise.allSettled(promises);
}

// ── Tool Dispatch ───────────────────────────────────────────────────

/**
 * Call a plugin tool. Returns the tool result or throws if not found.
 */
export async function callPluginTool(
  pluginId: string,
  toolName: string,
  params: Record<string, unknown>,
): Promise<unknown> {
  const plugin = plugins.get(pluginId);
  if (!plugin || plugin.status !== 'active') {
    throw new Error(`Plugin ${pluginId} not found or not active`);
  }
  if (!plugin.onToolCall) {
    throw new Error(`Plugin ${pluginId} does not handle tool calls`);
  }
  return plugin.onToolCall(toolName, params);
}

// ── Query Functions ─────────────────────────────────────────────────

/** Get all loaded plugins */
export function getPlugins(): Array<{
  id: string;
  name: string;
  version: string;
  status: string;
  capabilities: string[];
  error?: string;
}> {
  return [...plugins.values()].map((p) => ({
    id: p.manifest.id,
    name: p.manifest.name,
    version: p.manifest.version,
    status: p.status,
    capabilities: p.manifest.capabilities,
    error: p.error,
  }));
}

/** Get a specific plugin */
export function getPlugin(pluginId: string): PluginInstance | undefined {
  return plugins.get(pluginId);
}

/** Get all available plugin tools */
export function getPluginTools(): Array<{
  pluginId: string;
  pluginName: string;
  name: string;
  description: string;
}> {
  const tools: Array<{
    pluginId: string;
    pluginName: string;
    name: string;
    description: string;
  }> = [];

  for (const plugin of plugins.values()) {
    if (plugin.status !== 'active' || !plugin.manifest.tools) continue;
    for (const tool of plugin.manifest.tools) {
      tools.push({
        pluginId: plugin.manifest.id,
        pluginName: plugin.manifest.name,
        name: tool.name,
        description: tool.description,
      });
    }
  }

  return tools;
}

// ── Lifecycle ───────────────────────────────────────────────────────

/**
 * Shutdown all plugins gracefully.
 */
export async function shutdownPlugins(): Promise<void> {
  for (const [pluginId, plugin] of plugins) {
    if (plugin.shutdown) {
      try {
        await plugin.shutdown();
        logger.info({ pluginId }, 'Plugin shutdown complete');
      } catch (e) {
        logger.warn({ pluginId, error: String(e) }, 'Plugin shutdown failed');
      }
    }
  }
  plugins.clear();
  eventSubscriptions.clear();
}
