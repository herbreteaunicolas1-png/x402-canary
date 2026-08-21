# x402 Canary — Project Authority

Authority date: 2026-08-21
Version: 0.5.0

## Single production authority
- One product Worker only: `x402-canary`.
- One merchant origin only: `https://x402-canary.nicolas-x402-16f380a7.workers.dev`.
- The original 29-route portfolio is preserved unchanged in `src/catalog.ts`; the effective authority in `src/catalog-authority.ts` appends exactly three need-driven routes, for 32 total paid routes. Route count is infrastructure parity, not a commercial KPI.
- One payment middleware and one merchant payee: `0xa42a56C5Ad4E60CE4e45Bf8844656A496F5D9aB8`.
- Production network: Base mainnet `eip155:8453`.
- Production facilitator: PayAI `https://facilitator.payai.network`.
- D1 settlement ledger: `x402-canary-ledger`.
- `OFFRAMP_VERIFIED=false`; unofframped production exposure cap remains USD 250.
- Automatic seller-funded paid self-test spend remains exactly `$0`.

## Need-driven commercial pilot
New external-context routes selected from revealed coding-agent demand patterns, not from the legacy x402 catalog:
- `POST /v1/agent/npm-symbol-context` — `$0.015` per call.
- `POST /v1/agent/npm-api-diff` — `$0.025` per call.
- `POST /v1/agent/browser-context` — `$0.03` per call.

Existing experiments remain available but are not protected from commercial rejection:
- `POST /v1/agent/dependency-gate` — `$0.015` per call.
- `POST /v1/agent/release-gate` — `$0.04` per call.

All five reuse the canonical Worker/payment/ledger authority. The three new routes provide external/current state that a coding model cannot reliably derive from repository reasoning alone. AgentCash + Claude/Codex/Gemini wrappers are distribution surfaces, not additional products.

## Need-discovery doctrine
- Need discovery precedes product construction. The Promptfoo Need Discovery Lab hides proposed products and asks GPT/Claude/Gemini which external evidence/action is genuinely missing from realistic coding tasks.
- Model statements are hypothesis evidence only. Revealed tool adoption and independent paid usage outrank verbal preference.
- A candidate should require external/current state, expose a narrow machine-readable contract, have bounded unit economics and recur in autonomous workflows.

## Operating rules
- Independent external payer/repeat evidence outranks route count, listings, self-traffic or seller-reported volume.
- No PII enrichment, social scraping, trading execution/signals, gambling, medical/legal/tax advice, customer-fund custody or unrestricted/authenticated proxying.
- Cloudflare Workers is the production runtime. CleanChef, ProofOps and JuriPilot are never deployment runners or infrastructure dependencies.
- Merchant private key is never uploaded to GitHub, ChatGPT or Cloudflare; Worker holds only the public payee.
- Automated treasury sweep remains disabled until a compliant EUR off-ramp is verified.
- Paid routes fail closed before payment once the unofframped exposure cap is reached.

## Runtime truth
OpenAPI presence is necessary but insufficient. A route is live only when the public runtime challenge is x402 v2, exact price, Base mainnet, expected payee, canonical Base USDC, correct resource URL and Bazaar metadata. Transport-inconclusive checks cannot be called GREEN.
