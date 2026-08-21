# Distribution Gate Status

The authoritative automated buyer-visibility gate is `.github/workflows/distribution-visibility-gate.yml`.

A commercial route is not considered distributed merely because it exists in OpenAPI or returns x402. The gate requires:

- production `/health` reports exactly 32 paid routes;
- the three new need-driven routes exist in public OpenAPI;
- all three challenge with HTTP 402 before request-body validation;
- AgentCash discovery sees all three;
- AgentCash buyer search can retrieve each route from natural-language demand queries;
- registry refresh is attempted only when buyer search is not already green.

Public native distribution is also present in the repository:

- Claude marketplace at `.claude-plugin/marketplace.json`;
- Gemini extension at `gemini-extension.json` + `GEMINI.md`;
- Codex plugin marketplace at `.agents/plugins/marketplace.json` plus direct skill at `.agents/skills/x402-agent-context/SKILL.md`.

No paid self-traffic is used by this gate.
