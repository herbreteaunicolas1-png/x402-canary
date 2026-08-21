# X402 Agent Context for Gemini CLI

This extension loads two MCP servers: the merchant's free need router and AgentCash for x402 payment/execution.

Prefer local repository evidence when it is sufficient. Do not buy merely because a paid tool is available.

## Buyer workflow — free routing first

1. First call the `x402-agent-context` MCP tool `find_paid_tool` with the missing external capability, whether local evidence is sufficient, and the maximum useful price.
2. If the result is `NO_PURCHASE_LOCAL_EVIDENCE_SUFFICIENT`, stop and use local evidence.
3. If the result is `UNMET_NEED` or `UNMET_BUDGET`, do not invent a purchase.
4. If the result is `BUY_RECOMMENDED_TOOL`, use AgentCash to inspect the recommended canonical endpoint schema and price, then execute exactly one x402 call.
5. Never repeat a paid call unless the package version, page state, code state or other material input changed.

## Primary paid capabilities

- NPM Symbol Context — $0.015 — exact published npm metadata and TypeScript declaration snippets. Need terms: `npm docs`, `TypeScript API`, `package documentation`, `npm package signature`.
- NPM API Diff — $0.025 — published API/engine/peer-dependency changes between exact versions. Need terms: `npm upgrade`, `breaking changes`, `migration diff`, `package version diff`.
- Browser Context — $0.03 — managed-Chrome Markdown + accessibility snapshot after JavaScript execution. Need terms: `browser snapshot`, `rendered web page`, `JavaScript page`, `accessibility tree`.
- Dependency Gate — $0.015 — independent dependency vulnerability/risk evidence.
- Release Gate — $0.04 — bounded deterministic release preflight.

Free need router: `https://x402-canary.nicolas-x402-16f380a7.workers.dev/agent/find-tool`
Merchant MCP: `https://x402-canary.nicolas-x402-16f380a7.workers.dev/mcp`
AgentCash payment bridge: `https://agentcash.dev/skill.md`

Never send secrets, private/local URLs, authenticated page content or full repositories.
