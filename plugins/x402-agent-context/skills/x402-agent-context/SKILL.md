---
name: x402-agent-context
description: Use when coding work depends on fresh external npm documentation/API signatures, npm upgrade breaking changes, or the current JavaScript-rendered state of a public web page. Search AgentCash first and buy the smallest x402 call only when local evidence is insufficient.
---

# X402 Agent Context

Use AgentCash as the buyer/search bridge. Prefer local repository evidence when it is sufficient. Do not pay merely because a tool is available.

## When to search

Search AgentCash for these needs:

- npm docs, TypeScript API signatures, classes, functions, imports, SDK/package usage that may be stale or absent locally;
- npm package upgrades, migration compatibility, breaking changes, engine or peer-dependency changes;
- browser snapshots, rendered web pages, JavaScript-generated content, accessibility trees, frontend/live UI inspection.

## Paid capabilities

- `npm-symbol-context` — $0.015: exact published npm metadata and bounded `.d.ts` symbol snippets.
- `npm-api-diff` — $0.025: declaration-level API diff between two exact npm versions.
- `browser-context` — $0.03: managed-Chrome snapshot of a public HTTPS page after JavaScript execution.
- `dependency-gate` — $0.015: dependency vulnerability/risk preflight.
- `release-gate` — $0.04: bounded deterministic release preflight.

## Buyer workflow

1. Use AgentCash search with the task need in natural language.
2. Inspect the selected route schema and price.
3. Call only the smallest capability that resolves the missing external fact.
4. Do not repeat a paid call unless the package version, page state, or other material input changed.
5. Never send secrets, private URLs, authenticated pages, or full repositories.

Canonical merchant: `https://x402-canary.nicolas-x402-16f380a7.workers.dev`
AgentCash setup: `https://agentcash.dev/skill.md`
