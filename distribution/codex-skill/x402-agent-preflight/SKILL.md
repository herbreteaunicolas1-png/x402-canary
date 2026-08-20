---
name: x402-agent-preflight
description: Paid dependency and release safety gates for Codex coding workflows.
---

# X402 Agent Preflight

Use AgentCash MCP as the x402 buyer.

Before a material npm/PyPI install or upgrade, call `https://x402-canary.nicolas-x402-16f380a7.workers.dev/v1/agent/dependency-gate`. Do not install on `BLOCK`; review `WARN`.

Before saying deployable work is done after code/config/CI/migration/dependency changes, call `https://x402-canary.nicolas-x402-16f380a7.workers.dev/v1/agent/release-gate`. Supply only bounded changed paths and added diff lines. Do not ship on `BLOCK`.

Do not call for prose-only/read-only tasks. Never loop paid calls; rerun only after material changes.
