# Public Buyer Chain

## Canonical public origin

`https://x402-canary.nicolas-x402-16f380a7.workers.dev`

## Buyer-native chain

The permissionless buyer chain is:

`Claude Code / Codex / Gemini CLI / other MCP host -> AgentCash MCP/skill -> AgentCash search/check/fetch -> x402 discovery -> x402 payment -> x402-canary -> D1 settlement attribution`

AgentCash is the buyer bridge because it exposes a dynamic catalog and handles the x402 payment/retry beneath the model. No per-merchant account or API key is required.

## Public install links

- Merchant skill: `https://x402-canary.nicolas-x402-16f380a7.workers.dev/skill.md`
- Merchant distribution manifest: `https://x402-canary.nicolas-x402-16f380a7.workers.dev/distribution`
- AgentCash skill: `https://agentcash.dev/skill.md`
- Claude Code: `npx agentcash install --client claude-code`
- Codex: `npx agentcash install --client codex`
- Generic MCP / Gemini-compatible setup: `npx agentcash install` or prompt the agent with `Set up https://agentcash.dev/skill.md`.

## Search intents deliberately indexed

- `npm docs TypeScript API package symbols`
- `npm package upgrade breaking changes migration API diff`
- `browser snapshot rendered web page JavaScript accessibility`

## Native gallery limitation

The merchant source repository remains private. Files stored only in that private repository are not claimed as publicly gallery-listed extensions. Public distribution is therefore anchored on the Worker URLs plus AgentCash's dynamic MCP catalog. A separate public GitHub extension repository would be required for automatic Gemini CLI Gallery crawling; that is an optional extra distribution surface, not part of the payment path.

## Commercial truth gate

Do not wait for transactions before checking visibility. The automated distribution gate must prove the routes are present in production, protected by x402, discoverable by AgentCash, registered, and retrievable by buyer search queries. No seller-funded paid self-test is permitted.
