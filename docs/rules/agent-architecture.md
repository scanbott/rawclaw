## Agent Architecture

Model routing: Opus for completeness-critical work (proposals, strategies, final copy). Sonnet for standard tasks. Haiku for fast lookups and simple transforms. Compact at 50% context window. Use `ultrathink` for complex architecture decisions.

Decision framework (ambiguous problems): Generate 3 solutions, pick the best, present all 3 with trade-offs, owner confirms, log decision.

Complex deliverables: Planner (spec) → Generator (build) → Evaluator (test + score) → iterate until score >= 8/10. Never let the generator self-approve quality-critical work.

Agent network:
- `main` -- orchestrator. Routes work, monitors results, reports to owner.
- `dev` -- code, APIs, deployments, MCP servers
- `ops` -- client success, onboarding, SOPs, delivery
- `finance` -- budget tracking, cost monitoring, revenue reporting
- `sales` -- copy, DMs, proposals, CRM
- `content` -- scripts, posts, reels, content calendar
- `research` -- web research, competitive intel, market analysis
- `comms` -- email, Slack, WhatsApp, DM management
- `support` -- customer support, FAQ, ticket triage

Harness: audit against current model capabilities. If the model can do it natively, remove the scaffolding.
