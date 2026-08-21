# x402 Canary — Current Status

Updated: 2026-08-21 14:27 Europe/Paris

## Marker summary

- `RUNTIME_32_GREEN=1` — verified by the distribution gate: public `/health` reports 32 routes.
- `PUBLIC_DISTRIBUTION_GREEN=1` — public distribution surface is reachable and lists the promoted capabilities.
- `OPENAPI_32_GREEN=1` — public OpenAPI exposes exactly 32 paid operations.
- `NEW_ROUTES_402_GREEN=1` — NPM Symbol Context, NPM API Diff and Browser Context return an x402 payment challenge before body validation.
- `AGENTCASH_DISCOVERY_GREEN=1` — direct AgentCash discovery sees all three promoted routes with exact prices and no current discovery warnings.
- `PUBLIC_AGENT_INSTALLS_GREEN=1` — repository is public and contains direct Claude Code, Codex and Gemini CLI install surfaces in addition to AgentCash.
- `BUYER_VISIBILITY_GREEN` — **NO**. Natural-language AgentCash search did not surface the promoted route in the tested result set; the registry refresh also timed out. Exact buyer-intent phrases have now been moved verbatim into the route descriptions and a fresh visibility gate/deploy has been triggered. Do not claim buyer visibility until that gate returns the three exact paths.
- `PAYMENT_RAIL_GREEN` — **NO**. No independent external payment -> settlement -> successful fulfillment -> D1 attribution has yet been proven. Seller-funded/self-test payments never qualify.
- `NEED_DISCOVERY_GREEN` — **NO**. Promptfoo 0.122.0 is configured for the verified current frontier models GPT-5.6 Sol, Claude Opus 5 and Gemini 3.1 Pro Preview through one Vercel AI Gateway credential, but no executed result artifact with model/provider provenance exists yet.
- `FACTORY_DAILY_GREEN` — **NO** until buyer visibility, independent payment rail, cross-model Need Discovery and source/economics gates are all GREEN.

## Commercial priority

Promoted need-driven products:
- NPM Symbol Context — `$0.015`.
- NPM API Diff — `$0.025`.
- Browser Context — `$0.03`.

Dependency Gate (`$0.015`) and Release Gate (`$0.04`) remain running experiments. Commodity legacy routes remain canaries and are not commercial KPIs.

## Public buyer chain

Canonical permissionless path:

`Claude Code / Codex / Gemini CLI / other MCP host -> AgentCash search/install bridge or direct public skill/extension -> x402 discovery -> payment -> x402-canary -> successful handler -> D1 settlement + channel attribution`

Public repository: `https://github.com/herbreteaunicolas1-png/x402-canary`.

Direct/public surfaces are present for Claude Code, Codex and Gemini CLI. An integration request for an official `coding-context` skill has also been opened in `Merit-Systems/agentcash-skills` so the capability can enter the bundle already installed by AgentCash users.

## Transaction truth

A deployment or `402 Payment Required` response proves the seller side is prepared to accept a payment; it does **not** prove the full transaction rail. `PAYMENT_RAIL_GREEN` is granted only after one independent external buyer completes payment and the same transaction is observed as successful settlement/fulfillment and D1 attribution.

Current independent transaction proof: **none**.

## Need Discovery truth

`buyer-lab/need-discovery.yaml` defines the cross-model experiment using one Vercel AI Gateway across GPT-5.6 Sol, Claude Opus 5 and Gemini 3.1 Pro Preview. `.github/workflows/need-discovery-gate.yml` is fail-closed and refuses to grant `NEED_DISCOVERY_GREEN` without a real gateway credential, >=150 evaluated outputs, all three model families and persisted raw/report evidence.

The remaining external-auth prerequisite is `VERCEL_AI_GATEWAY_API_KEY`. Configuration alone is not evidence.

## Daily factory rule

Target after all factory markers turn GREEN: **up to three new APIs per day**, selected from the evidence-ranked Need Discovery backlog. No API is created merely to satisfy the number. Each candidate needs an external need, buyer trigger, channel, source-rights/economics, repeat loop and distribution proof before exposure.