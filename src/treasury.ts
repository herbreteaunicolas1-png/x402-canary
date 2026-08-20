import type { Context } from "hono";
import type { Env, Variables } from "./types.ts";

const DEFAULT_UNOFFRAMPED_CAP_USD = 250;

export function unofframpedCapUsd(env: Env): number {
  const raw = Number(env.UNOFFRAMPED_USDC_CAP ?? DEFAULT_UNOFFRAMPED_CAP_USD);
  if (!Number.isFinite(raw) || raw <= 0 || raw > 10_000) return DEFAULT_UNOFFRAMPED_CAP_USD;
  return raw;
}

export function exposureAllowed(env: Env, pendingGrossUsd: number): boolean {
  if (env.ENVIRONMENT !== "production") return true;
  if (env.OFFRAMP_VERIFIED === "true") return true;
  return pendingGrossUsd < unofframpedCapUsd(env);
}

export async function treasuryExposureGuard(c: Context<{ Bindings: Env; Variables: Variables }>, next: () => Promise<void>) {
  if (c.env.ENVIRONMENT !== "production" || c.env.OFFRAMP_VERIFIED === "true") return next();
  if (!c.env.DB) return c.json({ error: "payment_configuration_unavailable" }, 503);
  try {
    const row = await c.env.DB.prepare(`SELECT COALESCE(SUM(price_usd), 0) AS pending_gross_usd FROM settlements WHERE status='settled' AND offramp_status='pending'`).first<{ pending_gross_usd: number | string | null }>();
    const pending = Number(row?.pending_gross_usd ?? 0);
    if (!Number.isFinite(pending)) return c.json({ error: "treasury_exposure_unknown" }, 503);
    if (!exposureAllowed(c.env, pending)) return c.json({ error: "offramp_required", code: "UNOFFRAMPED_USDC_CAP_REACHED", cap_usd: unofframpedCapUsd(c.env) }, 503);
    return next();
  } catch (error) {
    console.error("treasury_exposure_check_failed", { error: String(error) });
    return c.json({ error: "treasury_exposure_unknown" }, 503);
  }
}
