# X402 Agent Context for Gemini CLI

Use the AgentCash MCP server for paid external capabilities. AgentCash handles discovery, schema inspection, x402 payment, retry, and wallet signing.

When local repository evidence is missing or stale, search AgentCash for the capability rather than guessing from model memory.

Primary commercial capabilities:

- NPM Symbol Context — search terms: `npm docs`, `TypeScript API`, `package documentation`, `npm package signature`. Exact published npm metadata and TypeScript declaration snippets. $0.015/call. Canonical endpoint: `https://x402-canary.nicolas-x402-16f380a7.workers.dev/v1/agent/npm-symbol-context`.
- NPM API Diff — search terms: `npm upgrade`, `breaking changes`, `migration diff`, `package version diff`. Compares public declaration symbols, Node engines and peer dependencies between exact published versions. $0.025/call. Canonical endpoint: `https://x402-canary.nicolas-x402-16f380a7.workers.dev/v1/agent/npm-api-diff`.
- Browser Context — search terms: `browser snapshot`, `rendered web page`, `JavaScript page`, `accessibility tree`. Managed-Chrome snapshot of a public HTTPS page after JavaScript execution. $0.03/call. Canonical endpoint: `https://x402-canary.nicolas-x402-16f380a7.workers.dev/v1/agent/browser-context`.

Decision policy:
- Prefer local source, installed types, existing tests and ordinary HTTP when they answer the question reliably.
- Buy one call when fresh external state materially changes the answer.
- Before the first paid call, use AgentCash `check_endpoint_schema` or `discover_api_endpoints`.
- Never loop paid calls without a material state/input change.
- Never send secrets, private/local URLs or whole repositories.
