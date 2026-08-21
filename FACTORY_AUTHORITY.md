# X402 Agent Factory — Authority

Authority date: 2026-08-21
Method: Need-First / Evidence-First

## Mission
Observe what autonomous agents genuinely lack and consume, then build only agent-payable products with evidenced independent demand, bounded unit economics and a repeat-use loop.

## Commercial KPI
Route count is not a commercial KPI. Existing legacy routes remain infrastructure canaries subject to portfolio triage.

## Candidate definition
`NEED + EXTERNAL EVIDENCE/ACTION + BUYER + CHANNEL + PAYMENT MODE + MARGIN + REPEAT LOOP`.

## Evidence priority
1. Independent buyers and repeat organic revenue.
2. Revealed agent-tool adoption/usage in real workflows.
3. Cross-model need-discovery convergence.
4. Model verbal preference only as hypothesis generation.
Listings, self-traffic and seller-reported volume do not establish demand.

## Distribution doctrine
Listing is insufficient. Every commercial product requires an installable/buyer-native path plus machine-readable discovery. Tool descriptions must tell the agent when **not** to buy because local evidence is sufficient.

## Human boundary
Only `ECONOMICS_GATE` for new non-zero spend/pricing and `EXTERNAL_AUTH_GATE` for unavoidable provider OAuth/captcha/review. Technical gates are automatic and fail-closed.

## Runtime execution
Dedicated GitHub repository `x402-canary` is the canonical source/deploy input. Cloudflare is the runtime. CleanChef, ProofOps and JuriPilot are not runners, dependencies or fallback targets.

## 0.5.0 need-driven pilot authorization
Exactly three new commercial context routes are authorized:
- NPM Symbol Context `$0.015`.
- NPM API Diff `$0.025`.
- Browser Context `$0.03`.

Dependency Gate `$0.015` and Release Gate `$0.04` remain running experiments but do not block replacement if external demand is weak.

All products reuse the single canonical Worker/payment/ledger authority. AgentCash plus Claude/Codex/Gemini wrappers are mandatory distribution surfaces. Scale/reinvestment remains blocked until independent external payer and repeat-use evidence exists.
