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
3. Cross-model Need Discovery convergence from executed Promptfoo runs with persisted provenance.
4. Model verbal preference only as hypothesis generation.
Listings, self-traffic and seller-reported volume do not establish demand.

## Distribution doctrine
Listing is insufficient. Every commercial product requires an installable/buyer-native path plus machine-readable discovery. Tool descriptions must tell the agent when not to buy because local evidence is sufficient.

Independent buyers cannot legitimately be forced to purchase. The commercial objective is maximum voluntary selection by making the capability uniquely useful, visible at the exact workflow trigger, reliably callable, low-friction, and economically preferable to alternatives. No deceptive routing, fake necessity, hidden self-traffic, or forced paid loop is authorized.

## Human boundary
Only `ECONOMICS_GATE` for new non-zero spend/pricing and `EXTERNAL_AUTH_GATE` for unavoidable provider OAuth/captcha/review. Technical gates are automatic and fail-closed.

## Runtime execution
Dedicated GitHub repository `x402-canary` is the canonical source/deploy input. Cloudflare is the runtime. CleanChef, ProofOps and JuriPilot are not runners, dependencies or fallback targets.

## Current need-driven pilot
Promoted commercial context routes:
- NPM Symbol Context `$0.015`.
- NPM API Diff `$0.025`.
- Browser Context `$0.03`.

Dependency Gate `$0.015` and Release Gate `$0.04` remain running experiments but do not block replacement if external demand is weak.

All products reuse the single canonical Worker/payment/ledger authority. AgentCash plus public Claude/Codex/Gemini install surfaces are mandatory distribution channels.

## Factory GREEN markers
The daily product factory is **blocked** unless all of the following are independently true:

1. `RUNTIME_GREEN`: canonical paid routes are deployed and the promoted routes challenge with valid x402 before body validation.
2. `BUYER_VISIBILITY_GREEN`: AgentCash discovery works and natural-language buyer searches surface each promoted capability; public Claude Code, Codex and Gemini install paths are reachable.
3. `PAYMENT_RAIL_GREEN`: at least one independent external payer completes payment -> settlement -> successful fulfillment -> D1 settlement + attribution. Seller-funded/self-test payments never qualify.
4. `NEED_DISCOVERY_GREEN`: Promptfoo has actually queried GPT-5.6 Sol, Claude Opus 4.6 and Gemini 3.1 Pro Preview; result artifacts are persisted with provider/model provenance. A need is promotable only when it recurs across tasks/models and is corroborated by external adoption/spend evidence.
5. `SOURCE_ECONOMICS_GREEN`: upstream rights, variable cost, rate limits, bounded failure mode, target price and gross-margin logic are documented.

## Daily target after GREEN
Once all five markers are GREEN, target **up to three new APIs per day**, not three routes for their own sake. Each daily candidate must:
- come from the ranked Need Discovery backlog rather than brainstorming;
- solve an external fact/action the buyer cannot cheaply reproduce locally;
- have a precise agent trigger and explicit non-trigger;
- ship through the existing Worker/payment/ledger authority unless a different channel is demonstrably superior;
- include OpenAPI/Bazaar/AgentCash metadata plus public Claude/Codex/Gemini install guidance where applicable;
- pass zero-spend runtime/discovery gates before exposure;
- be killed/repriced quickly when independent usage contradicts the hypothesis.

Scale/reinvestment remains blocked until independent payer and repeat-use evidence exists.