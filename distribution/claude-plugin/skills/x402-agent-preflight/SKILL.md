---
name: x402-agent-context
description: Fresh external coding context plus deterministic preflight. Route the need for free first; buy only when local evidence is insufficient.
---

# X402 Agent Context

Prefer local files, installed declarations and repository tests when they already answer the question. Do not buy a tool merely because it exists.

## Buyer workflow — free router first

1. Call the direct merchant MCP tool `find_paid_tool` first. The plugin loads the merchant MCP at `https://x402-canary.nicolas-x402-16f380a7.workers.dev/mcp` together with AgentCash.
2. Describe only the missing external fact and the maximum useful price; do not send secrets or full repository content.
3. `NO_PURCHASE_LOCAL_EVIDENCE_SUFFICIENT` means stop and use local evidence.
4. `UNMET_NEED` or `UNMET_BUDGET` means do not invent a purchase.
5. `BUY_RECOMMENDED_TOOL` means use AgentCash to inspect the recommended endpoint schema/price and execute exactly one x402 call.
6. Repeat only after a material package version, page state or code state change.

## Fresh external context

- **NPM Symbol Context — $0.015**: exact published npm package metadata and bounded TypeScript declaration snippets for requested symbols.
- **NPM API Diff — $0.025**: published `.d.ts` API diff, Node engine constraints and peer dependencies between two exact npm versions.
- **Browser Context — $0.03**: managed-Chrome Markdown + accessibility snapshot of a public HTTPS page after JavaScript execution.

## Existing preflight

- Dependency Gate — $0.015 — independent deps.dev/OSV evidence before material npm/PyPI changes.
- Release Gate — $0.04 — deterministic bounded release preflight for code/config/CI/migration changes.

Free need router: `https://x402-canary.nicolas-x402-16f380a7.workers.dev/agent/find-tool`
Merchant MCP: `https://x402-canary.nicolas-x402-16f380a7.workers.dev/mcp`
AgentCash payment bridge: `https://agentcash.dev/skill.md`

Never send secrets, private/internal URLs or authenticated page content.
