# X402 Agent Context

Use AgentCash as the x402 buyer MCP. Prefer local files, installed declarations and local tests whenever they already answer the question.

- **NPM Symbol Context — $0.015**: call `https://x402-canary.nicolas-x402-16f380a7.workers.dev/v1/agent/npm-symbol-context` when exact published npm metadata or current TypeScript API signatures matter and local declarations are missing/stale.
- **NPM API Diff — $0.025**: call `https://x402-canary.nicolas-x402-16f380a7.workers.dev/v1/agent/npm-api-diff` before upgrading between two exact npm versions when migration compatibility is uncertain. It compares published declarations, Node engine constraints and peer dependencies.
- **Browser Context — $0.03**: call `https://x402-canary.nicolas-x402-16f380a7.workers.dev/v1/agent/browser-context` when the answer depends on a public JavaScript-rendered page as managed Chrome actually sees it. It returns current Markdown plus an accessibility tree.

Dependency Gate ($0.015) and Release Gate ($0.04) remain available for independent dependency and release preflight evidence.

Do not pay for context that local evidence already provides. Never loop paid calls. Re-run only after a material package, page or code state change. Never send secrets or private/internal URLs.
