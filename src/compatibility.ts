import { gatewayRun, type GatewayTool } from "./engines.ts";
import type { EngineResponse } from "./types.ts";

export const INTENT_ALIASES: Readonly<Record<string, GatewayTool>> = Object.freeze({
  "exchange rate": "exchange-rates", "currency rate": "exchange-rates",
  "currency conversion": "fx-convert", "convert currency": "fx-convert",
  "recent earthquakes": "earthquakes-recent", "seismic events": "earthquakes-recent",
  "explain cron": "cron-explain", "cron schedule": "cron-explain",
  "domain preflight": "domain-preflight", "domain health": "domain-preflight",
  "domain enrichment": "domain-enrich", "mail security": "domain-enrich",
  "email validation": "email-preflight", "email domain check": "email-preflight",
  "dns lookup": "dns-lookup", "normalize url": "url-normalize", "url validation": "url-normalize",
  "inspect json": "json-inspect", "json validation": "json-inspect",
  "sha256": "hash-sha256", "text fingerprint": "hash-sha256",
});

function normalizeIntent(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

export async function resolveIntent(intentInput: string, input: unknown): Promise<EngineResponse<{ intent: string; tool: GatewayTool; canonical_route: string; result: unknown }>> {
  const intent = normalizeIntent(intentInput);
  if (!intent || intent.length > 80) throw new Error("invalid_intent");
  const tool = INTENT_ALIASES[intent];
  if (!tool) throw new Error("unsupported_intent");
  const delegated = await gatewayRun(tool, input);
  return { data: { intent, tool, canonical_route: "/v1/gateway/run", result: delegated.data.result }, meta: { ...delegated.meta, engine: "gateway", source: "intent_alias_to_internal_vetted_engines" } };
}
