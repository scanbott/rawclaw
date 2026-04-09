/**
 * Plugin Type Definitions for Raw Claw v2
 *
 * In-process TypeScript plugins with YAML manifest.
 * Simpler than Paperclip's JSON-RPC model -- plugins are
 * trusted modules loaded into the main process.
 */

// ── Plugin Manifest (plugin.yaml) ───────────────────────────────────

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;

  /** Capabilities this plugin requests */
  capabilities: PluginCapability[];

  /** Event subscriptions */
  events?: string[];

  /** Tools provided to agents during execution */
  tools?: PluginToolDeclaration[];

  /** Dashboard widgets */
  widgets?: PluginWidgetDeclaration[];

  /** Configuration schema (JSON Schema) */
  configSchema?: Record<string, unknown>;
}

export type PluginCapability =
  | 'events'       // Subscribe to system events
  | 'tools'        // Register tools for agents
  | 'state'        // Persist key-value state
  | 'http'         // Make HTTP requests
  | 'dashboard'    // Add dashboard widgets
  | 'notifications'; // Send notifications (Discord/Slack)

export interface PluginToolDeclaration {
  name: string;
  description: string;
  parameters?: Record<string, unknown>; // JSON Schema
}

export interface PluginWidgetDeclaration {
  id: string;
  title: string;
  slot: 'sidebar' | 'agent-detail' | 'dashboard-top' | 'dashboard-bottom';
}

// ── Plugin Instance ─────────────────────────────────────────────────

export interface PluginInstance {
  manifest: PluginManifest;
  status: 'loaded' | 'active' | 'error' | 'disabled';
  error?: string;

  /** Plugin lifecycle hooks */
  init?: () => Promise<void>;
  shutdown?: () => Promise<void>;

  /** Event handler */
  onEvent?: (event: PluginEvent) => Promise<void>;

  /** Tool handler -- called when an agent invokes a plugin tool */
  onToolCall?: (toolName: string, params: Record<string, unknown>) => Promise<unknown>;

  /** State store access */
  getState?: (key: string) => unknown;
  setState?: (key: string, value: unknown) => void;
}

// ── Plugin Events ───────────────────────────────────────────────────

export interface PluginEvent {
  type: string;
  timestamp: number;
  data: Record<string, unknown>;
}

// ── Plugin State Store ──────────────────────────────────────────────

export interface PluginStateStore {
  get(pluginId: string, key: string): unknown;
  set(pluginId: string, key: string, value: unknown): void;
  delete(pluginId: string, key: string): void;
  getAll(pluginId: string): Record<string, unknown>;
}
