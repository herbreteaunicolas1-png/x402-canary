# x402 Canary v0.5.0 — Agent Preflight

A production-minded x402 merchant canary for agent-native paid tools.

## Paid launch products

- `POST /v1/agent/dependency-gate` — **$0.015** per call
  - checks newly added or upgraded npm/PyPI dependencies before installation;
  - uses public `deps.dev` + OSV data;
  - returns deterministic `ALLOW | WARN | BLOCK` with evidence and safer-version hints.

- `POST /v1/agent/release-gate` — **$0.04** per call
  - inspects a bounded release evidence bundle / added diff only;
  - checks secrets, public-env leakage, deploy configuration, GitHub Actions, SQL migration hazards, dynamic execution and dependency deltas;
  - returns deterministic `PASS | WARN | BLOCK` with evidence.

## Distribution

The same merchant runtime exposes:

- x402 HTTP payment on Base;
- Bazaar discovery metadata;
- `/openapi.json`, `/llms.txt`, `/llms-full.txt`, `/skill.md`;
- MCP discovery and endpoint metadata;
- Claude Code plugin wrapper;
- Codex skill wrapper;
- Gemini CLI extension wrapper;
- AgentCash-compatible discovery/payment flow.

## Architecture constraints

- One merchant Worker: `x402-canary`.
- One payee and one payment middleware.
- Cloudflare Workers + D1 settlement ledger.
- Production network: Base mainnet (`eip155:8453`).
- Production facilitator: PayAI.
- No OpenAI/Anthropic/Gemini server-side LLM dependency for the two launch gates.
- No PII/social scraping/trading/gambling/medical/legal/tax/custody/unrestricted proxying.
- No automatic paid self-traffic.
- CleanChef, ProofOps and JuriPilot are out of scope and must never be used as deployment runners.

## Safety

Production promotion is fail-closed. Runtime 402 challenge parity, expected payee, price, D1 binding, discovery metadata and rollback gates must pass before a route is marked live for sale.

See `PROJECT_AUTHORITY.md`, `FACTORY_AUTHORITY.md`, `DEPLOYMENT_GATES.md` and `AGENT_PREFLIGHT_PRODUCT_V0_5.md`.
