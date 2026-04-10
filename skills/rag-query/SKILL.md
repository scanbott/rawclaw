---
name: rag-query
description: Query the BusinessOS knowledge graph via RAGAnything/LightRAG
user-invocable: false
---

# RAG Query

Query the BusinessOS knowledge graph for answers grounded in indexed documents.

## How to Query

```bash
curl -s -X POST http://localhost:8111/query \
  -H 'Content-Type: application/json' \
  -d '{"question": "QUESTION", "mode": "hybrid"}'
```

Response format:
```json
{"answer": "...", "mode": "hybrid"}
```

## Query Modes

| Mode | When to use |
|------|-------------|
| `hybrid` | Default. Combines local entity lookup + global pattern matching. Use for most questions. |
| `local` | Specific entity details. "What do we know about Tyler Stonehocker?" or "What's in the onboarding SOP?" |
| `global` | Cross-cutting patterns across the whole graph. "What objections come up most in sales calls?" |
| `naive` | Simple vector similarity. Last resort if graph modes return nothing useful. |

## What's Indexed

- `/Users/scanbot/knowledge` -- full Obsidian vault (clients, ops, sales, brand, strategy)
- `/Users/scanbot/.claude/skills` -- all agent skills
- `/Users/scanbot/BusinessOS/CLAUDE.md` and agent configs
- Auto-updated via file watcher on any .md/.txt change

## Fallback

If the RAG service is down (port 8111 not responding), fall back to direct file access:
- Use `Grep` to search file contents
- Use `Glob` to find files by pattern
- Use `Read` to read specific files

Check service health: `curl -s http://localhost:8111/health`

## Examples

```bash
# Find client info
curl -s -X POST http://localhost:8111/query -H 'Content-Type: application/json' \
  -d '{"question": "What are the key deliverables for Tyler Stonehocker?", "mode": "local"}'

# Find patterns
curl -s -X POST http://localhost:8111/query -H 'Content-Type: application/json' \
  -d '{"question": "What common objections do prospects raise about pricing?", "mode": "global"}'

# General question
curl -s -X POST http://localhost:8111/query -H 'Content-Type: application/json' \
  -d '{"question": "How does the client onboarding process work?", "mode": "hybrid"}'
```
