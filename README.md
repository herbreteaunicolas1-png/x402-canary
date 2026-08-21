# x402 Canary v0.5.0 — Agent Context

A production-minded x402 merchant canary for agent-native paid tools. The commercial method is **need first, product second**.

## Need-driven launch products

- `POST /v1/agent/npm-symbol-context` — **$0.015** per call
  - exact published npm package/version metadata;
  - optional bounded TypeScript declaration snippets for up to eight requested symbols;
  - intended for coding agents when local package context is absent or stale.

- `POST /v1/agent/npm-api-diff` — **$0.025** per call
  - compares two exact published npm versions;
  - reports added/removed/changed declaration symbols plus Node engine and peer-dependency changes;
  - intended before uncertain package upgrades.

- `POST /v1/agent/browser-context` — **$0.03** per call
  - renders a public HTTPS page through Cloudflare Browser Run;
  - returns bounded Markdown + accessibility-tree context and page status/title;
  - rejects private/local targets and accepts no cookies, credentials or arbitrary scripts.

## Existing experiments

- `POST /v1/agent/dependency-gate` — **$0.015** per call.
- `POST /v1/agent/release-gate` — **$0.04** per call.

They remain live experiments but are not assumed to have product-market fit.

## Need Discovery Lab

`buyer-lab/need-discovery.yaml` runs 30 engineering scenarios against GPT-5.6 Sol, Claude Opus 4.6 and Gemini 3.1 Pro Preview **without showing proposed products**. It captures missing external capability, workflow trigger, frequency, freshness/latency requirements and maximum acceptable per-call price. Model statements are hypothesis evidence; real tool adoption and independent payments outrank them.

## Distribution

The same merchant runtime exposes:
- x402 HTTP payment on Base;
- Bazaar discovery metadata;
- `/openapi.json`, `/llms.txt`, `/llms-full.txt`, `/skill.md`;
- MCP discovery and endpoint metadata;
- Claude Code plugin wrapper;
- Codex skill wrapper;
- Gemini CLI extension wrapper;
- AgentCash-compatible discovery/payment flow.

## Architecture constraints

- One merchant Worker: `x402-canary`.
- Original 29-route portfolio remains unchanged; effective authority adds exactly three new routes for 32 total.
- One payee and one payment middleware.
- Cloudflare Workers + D1 settlement ledger + Browser Run binding for the browser-context route.
- Production network: Base mainnet (`eip155:8453`).
- Production facilitator: PayAI.
- No OpenAI/Anthropic/Gemini server-side LLM dependency in the merchant runtime.
- No PII/social scraping/trading/gambling/medical/legal/tax/custody/unrestricted or authenticated proxying.
- No automatic paid self-traffic.
- CleanChef, ProofOps and JuriPilot are out of scope and must never be used as deployment runners.

## Safety

Production promotion is fail-closed. Runtime 402 challenge parity, expected payee, price, D1 binding, discovery metadata, Browser Run binding/target guards and rollback gates must pass before a new route is marked live for sale.

See `PROJECT_AUTHORITY.md`, `FACTORY_AUTHORITY.md`, `DEPLOYMENT_GATES.md`, `SOURCE_POLICY.md` and `UNIT_ECONOMICS.md`.
