# x402 Canary — Current Status

Updated: 2026-08-21

## Operational status

**RUNTIME_DISCOVERY_RED — not yet `LIVE_FOR_SALE`.**

- Dedicated GitHub authority is `herbreteaunicolas1-png/x402-canary` on `main` and is isolated from unrelated projects.
- One production Worker/origin remains authoritative: `https://x402-canary.nicolas-x402-16f380a7.workers.dev`.
- Effective runtime/payment/OpenAPI authority is exactly 32 paid routes: the preserved 29-route legacy catalog plus NPM Symbol Context, NPM API Diff and Browser Context.
- x402scan origin registration on 2026-08-21 registered 25 resources and skipped 7 because its live probe did not receive a 402 payment challenge.
- Exact skipped paths: `/v1/fx/rate`, `/v1/exchange-rates`, `/v1/fx/convert`, `/v1/currency-convert`, `/v1/seismic/recent`, `/v1/cron/validate`, `/v1/email/domain-check`.
- Therefore a successful `25/25` registration message is not a 32/32 runtime GREEN. The seven skipped routes remain a hard discovery/runtime defect until independently re-probed as valid x402 v2 challenges.
- Source parity is structurally GREEN: current payment middleware, OpenAPI and paid-handler construction all consume the same effective 32-route authority. The remaining defect is therefore treated as public-runtime/deployment drift until live evidence proves another cause.
- `scripts/verify-runtime.mjs` is the canonical zero-spend live verifier. It requires every route to return x402 v2 with exact resource URL, exact route price, Base mainnet, canonical Base USDC, expected payee and Bazaar metadata.
- GitHub-hosted runtime verification is currently unavailable: a fresh minimal Actions audit failed before its first step and was removed immediately to avoid persistent red/noise. Do not use GitHub Actions status as runtime evidence until runner execution is restored.
- Cloudflare Workers Builds remains the production deployment path. No second Worker, merchant origin or payment authority is authorized.

## Commercial priority

Promoted need-driven products are NPM API Diff (`$0.025`), NPM Symbol Context (`$0.015`) and Browser Context (`$0.03`). Dependency Gate (`$0.015`) and Release Gate (`$0.04`) remain running experiments. Commodity legacy utilities remain available as canaries but are not commercial KPIs.

Agent-native distribution exists through AgentCash plus the repository's Claude Code, Codex and Gemini CLI wrappers. The canonical paid execution path is still the HTTP x402 resource. The current `/mcp` endpoint is a discovery/redirect shim, not yet a native paid-MCP execution authority.

The cross-model Need Discovery Lab is configured for GPT-5.6 Sol, Claude Opus 4.6 and Gemini 3.1 Pro Preview, but no persisted result artifact is present in the repository. Cross-model convergence must not be claimed as executed evidence until a result artifact with provenance exists.

Independent external payment → settlement → successful fulfillment → D1 attribution proven: **NO**.

Factory method remains evidence-first: 32/32 runtime integrity is required before commercial GREEN, and independent payer/repeat-use evidence determines scale, repricing or kill decisions.
