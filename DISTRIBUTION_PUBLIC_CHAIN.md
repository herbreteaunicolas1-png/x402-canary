# Public Buyer Chain

## Canonical public origin

`https://x402-canary.nicolas-x402-16f380a7.workers.dev`

## Buyer-native chain

The permissionless buyer chain is:

`Claude Code / Codex / Gemini CLI / other MCP host -> AgentCash MCP/skill -> AgentCash search/check/fetch -> x402 discovery -> x402 payment -> x402-canary -> D1 settlement attribution`

AgentCash is the buyer bridge because it exposes a dynamic catalog and handles x402 payment/retry beneath the model. No per-merchant account or merchant API key is required.

## Public source and direct installs

Repository: `https://github.com/herbreteaunicolas1-png/x402-canary` (public).

- Merchant skill: `https://x402-canary.nicolas-x402-16f380a7.workers.dev/skill.md`
- Merchant distribution manifest: `https://x402-canary.nicolas-x402-16f380a7.workers.dev/distribution`
- AgentCash skill: `https://agentcash.dev/skill.md`
- Claude Code AgentCash bridge: `npx agentcash install --client claude-code`
- Claude Code direct marketplace: `/plugin marketplace add herbreteaunicolas1-png/x402-canary`, then `/plugin install x402-agent-context@x402-agent-context`
- Codex AgentCash bridge: `npx agentcash install --client codex`
- Codex direct skill: ask `$skill-installer` to install `https://github.com/herbreteaunicolas1-png/x402-canary/tree/main/.agents/skills/x402-agent-context`
- Gemini CLI direct extension: `gemini extensions install https://github.com/herbreteaunicolas1-png/x402-canary`
- Generic MCP: `npx agentcash install` or prompt the agent with `Set up https://agentcash.dev/skill.md`.

The public repo contains root-level Claude and Gemini manifests plus a Codex plugin/skill bundle. Direct installation is available without waiting for optional third-party gallery review.

## Search intents deliberately indexed

- `npm docs TypeScript API package symbols`
- `npm package upgrade breaking changes migration API diff`
- `browser snapshot rendered web page JavaScript accessibility`

## Commercial truth gate

Do not wait for transactions before checking visibility. `.github/workflows/distribution-visibility-gate.yml` must prove the routes are present in production, protected by x402, discoverable by AgentCash, and retrievable from buyer search queries. Registry refresh is attempted only when buyer search does not already find the route. No seller-funded paid self-test is permitted.
