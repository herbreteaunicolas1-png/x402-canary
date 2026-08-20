import type { Context } from "hono";
import { ROUTE_BY_KEY } from "./catalog.ts";
import type { Env, SettlementResponse, Variables } from "./types.ts";
import { decodeBase64Json, roundMoney } from "./util.ts";

export function attributionChannel(headers: Headers): string {
  const explicit = (headers.get("x-agent-channel") ?? headers.get("x-x402-channel") ?? "").trim().toLowerCase();
  if (/^[a-z0-9][a-z0-9:._-]{0,63}$/.test(explicit)) return explicit;
  const ua = (headers.get("user-agent") ?? "").toLowerCase();
  if (ua.includes("agentcash")) return "agentcash";
  if (ua.includes("payments-mcp") || ua.includes("coinbase")) return "mcp:coinbase";
  if (ua.includes("claude")) return "mcp:claude";
  if (ua.includes("codex")) return "mcp:codex";
  if (ua.includes("gemini")) return "mcp:gemini";
  if (ua.includes("x402scan")) return "x402scan";
  if (ua.includes("mcp")) return "mcp:generic";
  return "direct";
}

export async function ledgerOuterMiddleware(c: Context<{ Bindings: Env; Variables: Variables }>, next: () => Promise<void>) {
  const requestId = crypto.randomUUID(); c.set("requestId", requestId); c.header("x-request-id", requestId); await next();
  const route = ROUTE_BY_KEY.get(`${c.req.method} ${c.req.path}`); if (!route || !c.env.DB) return;
  const paymentHeader = c.res.headers.get("payment-response") ?? c.res.headers.get("x-payment-response"); if (!paymentHeader) return;
  const settlement = decodeBase64Json<SettlementResponse>(paymentHeader); if (!settlement?.success) return;
  const occurredAt = new Date().toISOString(); const channel = attributionChannel(c.req.raw.headers); const db = c.env.DB;
  c.executionCtx.waitUntil(recordSettlement(db, { requestId, occurredAt, method: c.req.method, path: c.req.path, routeId: route.id, engineId: route.engine, familyId: route.family, priceUsd: route.priceUsd, network: settlement.network ?? c.env.NETWORK, payer: settlement.payer ?? null, transactionHash: settlement.transaction ?? null, settledAmountAtomic: settlement.amount ?? null }).then(() => Promise.all([enrichEur(db, requestId, route.priceUsd), recordAttribution(db, requestId, channel, occurredAt)])).catch((error) => console.error("settlement_ledger_write_failed", { requestId, routeId: route.id, error: String(error) })));
}

async function recordSettlement(db: D1Database, row: { requestId: string; occurredAt: string; method: string; path: string; routeId: string; engineId: string; familyId: string; priceUsd: number; network: string; payer: string | null; transactionHash: string | null; settledAmountAtomic: string | null }) {
  await db.prepare(`INSERT OR IGNORE INTO settlements (request_id, occurred_at, method, path, route_id, engine_id, family_id, price_usd, network, payer, transaction_hash, settled_amount_atomic, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'settled')`).bind(row.requestId, row.occurredAt, row.method, row.path, row.routeId, row.engineId, row.familyId, row.priceUsd, row.network, row.payer, row.transactionHash, row.settledAmountAtomic).run();
}
async function recordAttribution(db: D1Database, requestId: string, channel: string, occurredAt: string) { await db.prepare(`INSERT OR IGNORE INTO settlement_attribution (request_id, channel, occurred_at) VALUES (?, ?, ?)` ).bind(requestId, channel, occurredAt).run(); }
async function enrichEur(db: D1Database, requestId: string, grossUsd: number) { try { const res = await fetch("https://api.frankfurter.dev/v2/rate/USD/EUR?providers=ECB", { signal: AbortSignal.timeout(5000) }); if (!res.ok) return; const json = await res.json() as { rate?: number }; const rate = json.rate; if (typeof rate !== "number" || !Number.isFinite(rate)) return; await db.prepare(`UPDATE settlements SET gross_eur=?, usd_eur_rate=?, eur_rate_source=? WHERE request_id=?`).bind(roundMoney(grossUsd * rate, 8), roundMoney(rate, 10), "Frankfurter v2 / ECB", requestId).run(); } catch {} }
