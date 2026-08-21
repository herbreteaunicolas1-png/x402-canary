---
name: x402-agent-context
description: Use AgentCash to buy fresh external context only when local evidence is insufficient: exact npm TypeScript API docs, npm upgrade breaking-change diff, and browser-rendered page snapshots.
---

# X402 Agent Context

AgentCash is the buyer/search/payment layer. Use its MCP tools to search, inspect schema and fetch paid resources.

Primary capabilities:

- NPM Symbol Context — $0.015/call. Search `npm docs`, `TypeScript API`, `package documentation`, `npm package signature`. Endpoint: `https://x402-canary.nicolas-x402-16f380a7.workers.dev/v1/agent/npm-symbol-context`.
- NPM API Diff — $0.025/call. Search `npm upgrade`, `breaking changes`, `migration diff`, `package version diff`. Endpoint: `https://x402-canary.nicolas-x402-16f380a7.workers.dev/v1/agent/npm-api-diff`.
- Browser Context — $0.03/call. Search `browser snapshot`, `rendered web page`, `JavaScript page`, `accessibility tree`. Endpoint: `https://x402-canary.nicolas-x402-16f380a7.workers.dev/v1/agent/browser-context`.

Before a first paid call use AgentCash `check_endpoint_schema` or `discover_api_endpoints`. Prefer free local evidence when sufficient. Never loop paid calls without a material input/state change. Never send secrets, private/local URLs or whole repositories.
