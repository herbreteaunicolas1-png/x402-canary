# x402 Canary 0.5.0 — Automatic Deployment Gates

Authority date: 2026-08-21

All technical gates are automatic and fail-closed. Approved pilot prices are NPM Symbol Context `$0.015`, NPM API Diff `$0.025`, Browser Context `$0.03`, Dependency Gate `$0.015`, and Release Gate `$0.04`. Automatic paid self-test spend remains `$0`.

1. Exact route parity: effective `ROUTES = handler map/router = paywall = OpenAPI/Bazaar = ledger`; legacy `src/catalog.ts` remains exactly 29 routes and effective authority is exactly 32.
2. Install pinned dependencies; TypeScript, contract tests, offline/security/secret checks GREEN.
3. Apply only additive/idempotent D1 migrations.
4. Production deployment targets the existing `x402-canary` Worker only; never create another merchant origin.
5. Public runtime must expose the exact 32-route effective set and challenge before body validation.
6. Mainnet invariant: x402 v2, Base `eip155:8453`, expected payee, exact price, canonical Base USDC, exact resource URL and Bazaar metadata.
7. Browser Context additionally requires a valid Browser Run binding and public-target guard; private/local targets fail closed.
8. A failed runtime/discovery invariant blocks commercial GREEN and requires rollback to the prior known-good Worker version.
9. AgentCash discovery audit is advisory; runtime 402 is authoritative.
10. x402scan publication is sequential/route-specific; do not treat an origin refresh as demand evidence.
11. Native Claude/Codex/Gemini wrappers advertise a paid tool only with a local-evidence-first usage rule.
12. Provider OAuth/captcha/review is the only `EXTERNAL_AUTH_GATE`.
13. Commercial success is not declared until independent external payment → settlement → fulfillment → D1 attribution is observed.
