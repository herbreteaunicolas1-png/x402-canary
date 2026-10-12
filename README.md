# Xynthera AI — EUDI Assurance Developer Kit

> **Temporary repository slug:** this public repository still has the legacy GitHub name `x402-canary`. The project and all new code in this repository are **Xynthera AI**. The old x402 experiment is retired for this repository.

Xynthera AI is a vendor-neutral operational assurance layer for EUDI Wallet Relying Parties.

It does **not** replace your wallet or verifier.

## Public developer surfaces

- **Xynthera AI TypeScript SDK** — `packages/sdk`
- **Xynthera AI CLI** — `packages/cli`
- **OpenAPI** — `openapi.yaml`

## Hosted APIs

- **Xynthera AI RP Guard API** — independent preflight plus ES256 evidence receipts.
- **Xynthera AI RP Watch API** — continuous trust/registry/certificate monitoring.
- **Xynthera AI WRPRC Monitor API** — lifecycle monitoring for providers/integrators.
- **Xynthera AI Registration API** — TS5 v1.5 + selected TS6 semantic validation.

### Guard evidence binding

Guard can bind a client-supplied verifier context into the signed receipt:

- verifier vendor/product/version;
- deployment identifier;
- policy version;
- SHA-256 policy hash.

The receipt is signed ES256 and can be verified with the public Xynthera JWKS.

## Live beta

Public beta information:
https://pfxxzsnboehxsefyajml.supabase.co/functions/v1/xynthera-ai-site/

OpenAPI:
https://pfxxzsnboehxsefyajml.supabase.co/functions/v1/xynthera-ai-docs/openapi.yaml

JWKS:
https://pfxxzsnboehxsefyajml.supabase.co/functions/v1/xynthera-ai-eudi/jwks.json

## Product boundary

This repository intentionally publishes the **client-side developer kit**, not the hosted Xynthera operational engine.

The hosted engine provides:
- multi-tenant API keys and quotas;
- scheduled monitoring;
- trust-state maintenance;
- webhook delivery/retries;
- signed evidence receipts;
- Germany-first national adapters.

## Status

Commercial beta target: **26 October 2026**.

Germany-first. France and other EU adapters follow only when official national interfaces are verified.

## Licence

The SDK and CLI in this repository are MIT licensed. Third-party and EU reference materials retain their own licences.
