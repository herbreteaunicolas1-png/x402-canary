---
name: x402-agent-context
description: Fresh external coding context and deterministic preflight for Codex. Pay only when local evidence is insufficient.
---

# X402 Agent Context

Use AgentCash MCP as the x402 buyer. Prefer repository files, installed package declarations and local tests when sufficient.

- **NPM Symbol Context — $0.015**: `POST https://x402-canary.nicolas-x402-16f380a7.workers.dev/v1/agent/npm-symbol-context` when exact published npm metadata or a current TypeScript API signature is needed and local declarations are missing/stale. Request only needed symbols.
- **NPM API Diff — $0.025**: `POST https://x402-canary.nicolas-x402-16f380a7.workers.dev/v1/agent/npm-api-diff` before an uncertain npm upgrade between two exact versions. Compare published declaration exports, Node engines and peer dependencies.
- **Browser Context — $0.03**: `POST https://x402-canary.nicolas-x402-16f380a7.workers.dev/v1/agent/browser-context` when a task depends on a public JavaScript-rendered page as Chrome actually sees it. It returns current Markdown plus an accessibility tree.

Dependency Gate ($0.015) and Release Gate ($0.04) remain available for independent dependency-risk and release preflight evidence.

Do not buy context that can be obtained reliably from local files. Never loop paid calls. Re-run only after a material package/page/code state change. Never send secrets or private/internal URLs.
