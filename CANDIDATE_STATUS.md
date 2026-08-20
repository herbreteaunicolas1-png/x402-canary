# x402 Canary 0.5.0 — Candidate Status

Status: SOURCE_MATERIALIZED / CLOUDFLARE_GIT_CONNECTION_PENDING
Date: 2026-08-20

## Canonical commercial-priority routes
- Dependency Gate — POST `/v1/agent/dependency-gate` — `$0.015`
- Release Gate — POST `/v1/agent/release-gate` — `$0.04`

## Structural state
- Dedicated GitHub repo: GREEN.
- One production Worker authority: `x402-canary`.
- Production config default: Base mainnet + PayAI + canonical payee + D1.
- Testnet config isolated in `wrangler.testnet.jsonc`.
- Runtime/discovery/payment/ledger source materialized.
- Native Claude/Codex/Gemini wrappers materialized.
- Automatic self-spend: `$0`.

## Remaining network gate
Connect this repository to the existing Cloudflare Worker through Workers Builds, let Cloudflare execute the fail-closed build/deploy, then verify all 29 public 402 challenges. Until that succeeds, status is not `LIVE_FOR_SALE`.
