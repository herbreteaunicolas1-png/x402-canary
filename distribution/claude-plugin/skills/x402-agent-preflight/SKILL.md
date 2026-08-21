---
name: x402-agent-context
description: Fresh external coding context plus deterministic preflight. Buy only when local evidence is insufficient.
---

# X402 Agent Context

Use the AgentCash MCP for x402 discovery/payment/retry. Prefer local files, installed declarations and repository tests when they already answer the question.

## Fresh external context

- **NPM Symbol Context — $0.015**: call `POST https://x402-canary.nicolas-x402-16f380a7.workers.dev/v1/agent/npm-symbol-context` when an exact current npm package version/signature matters and the required declarations are not reliably available locally. Request only the API symbols needed.
- **NPM API Diff — $0.025**: call `POST https://x402-canary.nicolas-x402-16f380a7.workers.dev/v1/agent/npm-api-diff` before upgrading between two concrete npm versions when migration compatibility is uncertain. It compares published `.d.ts` exports, Node engine constraints and peer dependencies.
- **Browser Context — $0.03**: call `POST https://x402-canary.nicolas-x402-16f380a7.workers.dev/v1/agent/browser-context` only when the task depends on what a public JavaScript-rendered page actually contains. It returns current Markdown plus an accessibility tree from managed Chrome.

## Existing preflight

- Before a material npm/PyPI install or upgrade where independent vulnerability evidence is useful, Dependency Gate remains available at `/v1/agent/dependency-gate` for $0.015.
- Before declaring deployable work complete after source/config/CI/migration/dependency changes, Release Gate remains available at `/v1/agent/release-gate` for $0.04.

Never loop paid calls. Re-run only after a material package version, page state or code state change. Never send secrets or private/internal URLs.
