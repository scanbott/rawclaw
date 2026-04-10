---
name: mcp-creator
description: Build MCP (Model Context Protocol) servers from scratch. Use when the user asks to "build an MCP server", "create an MCP", "make a tool server", "add MCP tools", or needs to connect an API/service as an MCP server for Claude.
---

# MCP Creator Skill

Build production-ready MCP servers in Python or TypeScript. Load the full implementation guide from `references/implementation-guide.md` before writing any code.

## Process

1. **Clarify the use case**: What API/service/data source is being connected? What tools does the LLM need?
2. **Read the guide**: `Read references/implementation-guide.md` for templates, patterns, and security requirements
3. **Choose language**: Python (FastMCP) for most cases. TypeScript for Cloudflare Workers or existing TS codebases.
4. **Choose transport**: stdio for local/Claude Code. SSE for remote/cloud.
5. **Build the server** following the mandatory patterns below
6. **Install it** using the self-install skill patterns

## Mandatory Patterns (never skip these)

- **Lifespan management**: Initialize resources once, clean up on shutdown. No per-call connections.
- **Error handling**: Tools return error strings, never raise exceptions.
- **Tool docstrings**: These ARE the LLM's instructions. Be specific about what each tool does and when to use it.
- **Input validation**: Validate and sanitize all inputs. Check for SQL injection, XSS, command injection.
- **Return strings**: Tools always return strings (use json.dumps for structured data).
- **Async everything**: All tool functions must be async.

## Quick Start (Python)

```python
from mcp.server.fastmcp import FastMCP, Context
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator
from dataclasses import dataclass
import asyncio, json, os

@dataclass
class AppContext:
    client: any

@asynccontextmanager
async def app_lifespan(server: FastMCP) -> AsyncIterator[AppContext]:
    client = await init_client()
    try:
        yield AppContext(client=client)
    finally:
        await client.close()

mcp = FastMCP("server-name", lifespan=app_lifespan)

@mcp.tool()
async def my_tool(ctx: Context, param: str) -> str:
    """Clear description of what this tool does and when to use it."""
    try:
        client = ctx.request_context.lifespan_context.client
        result = await client.do_thing(param)
        return json.dumps(result, indent=2)
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    transport = os.getenv("TRANSPORT", "stdio")
    if transport == "sse":
        asyncio.run(mcp.run_sse_async())
    else:
        asyncio.run(mcp.run_stdio_async())
```

## Installation After Build

```bash
# Python stdio server
npx -y @anthropic-ai/claude-code mcp add -s user <name> -- python3 /path/to/server.py

# Python with env vars
npx -y @anthropic-ai/claude-code mcp add -s user -e API_KEY=xxx <name> -- python3 /path/to/server.py

# Node stdio server
npx -y @anthropic-ai/claude-code mcp add -s user <name> -- node /path/to/server.js
```

## File Structure

```
~/tools/mcp-servers/<server-name>/
  server.py (or index.ts)
  requirements.txt (or package.json)
  .env.example
```

## After Building

- Test the server by running it and calling tools
- Install it with `mcp add`
- Update `self-install/SKILL.md` "Currently Installed" table
- Update CLAUDE.md if significant
