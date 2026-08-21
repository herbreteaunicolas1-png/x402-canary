# Distribution Gate Status

The authoritative automated buyer-visibility gate is `.github/workflows/distribution-visibility-gate.yml`.

A commercial route is not considered distributed merely because it exists in OpenAPI or returns x402. The gate requires:

- production `/health` reports exactly 32 paid routes;
- the three new need-driven routes exist in public OpenAPI;
- all three challenge with HTTP 402 before request-body validation;
- AgentCash discovery sees all three;
- the origin is re-registered in the AgentCash index;
- AgentCash buyer search can retrieve each route from natural-language demand queries.

No paid self-traffic is used by this gate.
