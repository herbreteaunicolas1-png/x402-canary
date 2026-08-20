# X402 Agent Factory — Authority

Authority date: 2026-08-20
Method: Evidence-First

## Mission
Build only agent-payable products with evidenced independent demand, buyer-native consumption, bounded unit economics and a repeat-use loop.

## Commercial KPI
Route count is not a commercial KPI. Existing legacy routes remain infrastructure canaries subject to portfolio triage.

## Candidate definition
`VALUE + BUYER + CHANNEL + PAYMENT MODE + MARGIN + REPEAT LOOP`.

## Evidence priority
Independent buyers and repeat organic revenue outrank raw call counts, listings, self-traffic and seller-reported volume.

## Distribution doctrine
Listing is insufficient. Every commercial product requires an installable/buyer-native path plus machine-readable discovery.

## Human boundary
Only `ECONOMICS_GATE` for new non-zero spend/pricing and `EXTERNAL_AUTH_GATE` for unavoidable provider OAuth/captcha/review. Technical gates are automatic and fail-closed.

## Runtime execution
Dedicated GitHub repository `x402-canary` is the canonical source/deploy input. Cloudflare is the runtime. CleanChef, ProofOps and JuriPilot are not runners, dependencies or fallback targets.

## 0.5.0 bounded pilot authorization
- Dependency Gate `$0.015` and Release Gate `$0.04` are the only new commercial-priority routes authorized by this pilot.
- Both reuse the single canonical Worker/payment/ledger authority and have zero paid-upstream dependency.
- AgentCash plus Claude/Codex/Gemini wrappers are mandatory distribution surfaces.
- Scale/reinvestment remains blocked until independent external payer and repeat-use evidence exists.
