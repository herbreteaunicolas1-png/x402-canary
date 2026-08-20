# x402 Canary 0.5.0 — Automatic Deployment Gates

Authority date: 2026-08-20

All technical gates are automatic and fail-closed. Economics for Dependency Gate `$0.015` and Release Gate `$0.04` are approved for the bounded paid canary. Automatic paid self-test spend remains `$0`.

1. Exact route parity: `ROUTES = handler map/router = paywall = OpenAPI/Bazaar`.
2. Install pinned dependencies; TypeScript, contract tests, offline/security/secret checks GREEN.
3. Apply only additive/idempotent D1 migrations.
4. Production deployment targets the existing `x402-canary` Worker only; never create another merchant origin.
5. Public runtime must expose the exact 29-route canonical set and challenge before body validation.
6. Mainnet invariant: x402 v2, Base `eip155:8453`, expected payee, exact price, canonical Base USDC, exact resource URL and Bazaar metadata.
7. A failed runtime/discovery invariant blocks commercial GREEN and requires rollback to the prior known-good Worker version.
8. AgentCash discovery audit is advisory; runtime 402 is authoritative.
9. x402scan publication is sequential/route-specific; bulk origin refresh is forbidden.
10. Native Claude/Codex/Gemini wrappers are published only after production runtime is GREEN.
11. Provider OAuth/captcha/review is the only `EXTERNAL_AUTH_GATE`.
12. Commercial success is not declared until independent external payment → settlement → fulfillment → D1 attribution is observed.
