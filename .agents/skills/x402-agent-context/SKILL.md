---
name: x402-agent-context
description: Use when coding work depends on fresh external npm documentation/API signatures, npm upgrade breaking changes, or the current JavaScript-rendered state of a public web page. Route the need for free first, then buy the smallest x402 call only when local evidence is insufficient.
---

# X402 Agent Context

Prefer local repository evidence when it is sufficient. Do not pay merely because a tool is available.

## Buyer workflow — free routing first

1. First call the merchant's free `find_paid_tool` MCP tool. If the direct MCP is not loaded, POST the need to `https://x402-canary.nicolas-x402-16f380a7.workers.dev/agent/find-tool`.
2. Describe the missing external fact and a maximum useful price. Do not send secrets or full repository content.
3. If the router returns `NO_PURCHASE_LOCAL_EVIDENCE_SUFFICIENT`, stop and use local evidence.
4. If it returns `UNMET_NEED` or `UNMET_BUDGET`, do not invent a purchase.
5. If it returns `BUY_RECOMMENDED_TOOL`, use AgentCash to inspect the recommended canonical endpoint schema/price and execute exactly one x402 call.
6. Do not repeat a paid call unless the package version, page state, or other material input changed.

## Need categories

- npm docs, TypeScript API signatures, classes, functions, imports, SDK/package usage that may be stale or absent locally;
- npm package upgrades, migration compatibility, breaking changes, Node engine or peer-dependency changes;
- browser snapshots, rendered web pages, JavaScript-generated content, accessibility trees, frontend/live UI inspection.

## Paid capabilities

- `npm-symbol-context` — $0.015 — exact published npm metadata and bounded `.d.ts` symbol snippets.
- `npm-api-diff` — $0.025 — declaration-level API diff between two exact npm versions.
- `browser-context` — $0.03 — managed-Chrome snapshot of a public HTTPS page after JavaScript execution.
- `dependency-gate` — $0.015 — dependency vulnerability/risk preflight.
- `release-gate` — $0.04 — bounded deterministic release preflight.

Canonical merchant: `https://x402-canary.nicolas-x402-16f380a7.workers.dev`
Free need router: `https://x402-canary.nicolas-x402-16f380a7.workers.dev/agent/find-tool`
Merchant MCP: `https://x402-canary.nicolas-x402-16f380a7.workers.dev/mcp`
AgentCash setup/payment bridge: `https://agentcash.dev/skill.md`
