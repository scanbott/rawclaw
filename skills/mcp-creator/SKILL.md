---
name: mcp-creator
description: Build a new MCP (Model Context Protocol) server from scratch. Adds new tools to the agent's capabilities.
triggers: ["build MCP", "create MCP server", "new MCP", "add tool", "mcp server"]
---

# MCP Creator

## What is an MCP Server

MCP servers extend what agents can do. They expose tools (functions) that agents can call via the Model Context Protocol. If you need to connect to a new API, database, or service -- build an MCP server.

## When to Build One

- You need to connect to an external API that doesn't have a CLI
- You want a reusable tool available across all agents
- The task is too complex for a bash one-liner skill

## Quick MCP Server Template (TypeScript)

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  { name: '[server-name]', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'tool_name',
      description: 'What this tool does',
      inputSchema: {
        type: 'object',
        properties: {
          param1: { type: 'string', description: 'What param1 is' },
        },
        required: ['param1'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'tool_name') {
    // Your logic here
    return {
      content: [{ type: 'text', text: 'Result' }],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

## Build Process

1. Create `mcp/[server-name]/` directory
2. Initialize: `cd mcp/[server-name] && npm init -y && npm install @modelcontextprotocol/sdk`
3. Create `index.ts` from template above
4. Add `tsconfig.json` and `package.json` scripts
5. Build: `npm run build`
6. Test: `node dist/index.js` -- should start without errors

## Registration

Add to the agent's CLAUDE.md or to a shared MCP config so agents can discover it.

## Dependencies

```bash
npm install @modelcontextprotocol/sdk
npm install -D typescript @types/node tsx
```
