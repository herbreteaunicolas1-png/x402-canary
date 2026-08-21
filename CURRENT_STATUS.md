# x402 Canary — Current Status

Updated: 2026-08-21 15:00 Europe/Paris

## Verified seller-side markers before this release

- `RUNTIME_32_GREEN=1` — public `/health` previously verified at 32 paid routes.
- `PUBLIC_DISTRIBUTION_GREEN=1` — public distribution surface previously verified.
- `OPENAPI_32_GREEN=1` — public OpenAPI previously verified at exactly 32 paid operations.
- `NEW_ROUTES_402_GREEN=1` — NPM Symbol Context, NPM API Diff and Browser Context previously verified to challenge with x402 before body validation.
- `AGENTCASH_DISCOVERY_GREEN=1` — direct AgentCash discovery previously saw the three promoted routes with exact prices.
- `PUBLIC_AGENT_INSTALLS_GREEN=1` — repository is public and exposes Claude Code, Codex and Gemini CLI install/discovery surfaces.
- `PAYMENT_RAIL_GREEN=0` — no independent external payment -> settlement -> successful fulfillment -> D1 attribution has yet been proven. Seller-funded tests never qualify.

## Release now being promoted

This release removes the paid Vercel AI Gateway from Need Discovery entirely.

- `PAID_AI_GATEWAY=0`.
- No `VERCEL_AI_GATEWAY_API_KEY` is required by the Need Discovery pilot.
- Promptfoo remains pinned, but the actual buyer-need interrogation is performed locally through authenticated `codex`, `claude` and `gemini` CLIs using existing ChatGPT/Claude/Google login/subscription paths.
- GitHub Actions validates the harness only; it does not pretend to have executed the three models.
- `NEED_DISCOVERY_GREEN` remains **NO** until `buyer-lab/run-local-need-discovery.ps1` produces a real three-CLI result artifact.

## Free need-to-paid funnel

A new free routing step is being deployed without changing the 32 paid-route count:

`coding agent -> free find_paid_tool -> deterministic need/budget match -> paid route only when justified -> x402 payment -> fulfillment -> D1 settlement`

Public surfaces after deployment:
- MCP tool: `find_paid_tool`.
- HTTP: `POST /agent/find-tool`.
- Price: `$0`.
- Raw task text stored: **NO**.
- Stored evidence: task hash, need category, acquisition channel, stated max price, freshness requirement, local-evidence flag and recommended route.
- `BUY_RECOMMENDED_TOOL` is returned only when a promoted capability matches the need and is within the buyer's stated budget.
- `NO_PURCHASE_LOCAL_EVIDENCE_SUFFICIENT`, `UNMET_NEED` and `UNMET_BUDGET` deliberately prevent fake/uneconomic purchases and become product-discovery evidence.

The new D1 table is `agent_need_signals`; it does not contain raw prompts.

## Promoted paid products

- NPM Symbol Context — `$0.015`.
- NPM API Diff — `$0.025`.
- Browser Context — `$0.03`.
- Dependency Gate — `$0.015` experiment.
- Release Gate — `$0.04` experiment.

## Buyer visibility gate

The distribution workflow now requires all of the following before buyer visibility is called GREEN:
1. active Cloudflare runtime still serves 32 paid routes;
2. `/distribution` advertises the free need router and public AgentCash/direct MCP paths;
3. `POST /agent/find-tool` returns `BUY_RECOMMENDED_TOOL` for a deterministic npm-symbol need without storing raw task text;
4. MCP `tools/list` exposes `find_paid_tool`;
5. all three new paid routes still return x402 `402` challenges;
6. AgentCash direct discovery sees all three routes;
7. natural-language AgentCash search surfaces each promoted path for its real buyer-intent phrase.

`BUYER_VISIBILITY_GREEN` is **not claimed until this post-deploy workflow succeeds**.

## Cross-model Need Discovery

The local calibration path is:

`Promptfoo -> cli-provider.mjs -> Codex CLI / Claude Code / Gemini CLI -> structured need JSON -> summarize-needs.mjs`

The wrapper deliberately removes provider API-key environment variables so stored app/CLI login is used instead of accidentally charging a separate developer API account. Concurrency is one and the pilot is bounded.

This calibration is for need discovery, not for manufacturing favorable opinions about existing products. It asks whether the task can be completed locally and, only when it cannot, requests the missing external capability, trigger, frequency, freshness, latency tolerance and maximum economically acceptable per-call price.

## Commercial truth

A 402 response, a listing or a GREEN deployment is not demand. Independent external transactions remain the commercial truth. The free need router adds a second leading indicator: repeated unmet needs from real agent calls can now be measured before a paid product exists.

Current independent transaction proof: **none**.
