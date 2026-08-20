# X402 Agent Preflight — Product Authority V0.5

Date: 2026-08-20
Status: BUILD IMPLEMENTED / NETWORKED PROMOTION PENDING

## Dependency Gate
- `POST /v1/agent/dependency-gate`
- `$0.015` per call, maximum 5 npm/PyPI candidates.
- deps.dev + OSV evidence; deterministic `ALLOW | WARN | BLOCK`.
- Repeat trigger: each material dependency add/upgrade.
- Paid upstream cost: none.

## Release Gate
- `POST /v1/agent/release-gate`
- `$0.04` per call.
- Bounded changed-file paths + added diff lines only; no repository upload.
- Secret/public-env/deploy/container/GitHub Action/SQL/dynamic-execution checks plus optional dependency preflight.
- Deterministic `PASS | WARN | BLOCK`.
- Paid upstream cost: none beyond optional public dependency-data lookups.

## Buyer-native channels
AgentCash MCP, x402 OpenAPI/Bazaar, route-specific x402scan listing, Claude Code wrapper, Codex wrapper, Gemini CLI extension, `/skill.md`, `/llms.txt`, `/llms-full.txt`.

## Experiment truth
Primary KPI is independent external payers and repeat usage, not raw calls or route count. Operator/self activity never proves demand.
