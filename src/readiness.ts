import type { Env } from "./types.ts";
import { facilitatorMode } from "./payment-config.ts";
import { unofframpedCapUsd } from "./treasury.ts";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function realPayee(value: string | undefined): boolean {
  return !!value && /^0x[a-fA-F0-9]{40}$/.test(value) && value.toLowerCase() !== ZERO_ADDRESS;
}

function resolveFacilitatorMode(env: Env): string {
  try { return facilitatorMode(env); } catch { return "invalid"; }
}

export function buildReadiness(env: Env) {
  const payeeConfigured = realPayee(env.PAY_TO);
  const d1Bound = !!env.DB;
  const publicBaseUrlConfigured = /^https:\/\//.test(env.PUBLIC_BASE_URL ?? "");
  const offrampVerified = env.OFFRAMP_VERIFIED === "true";
  const treasuryCapUsd = unofframpedCapUsd(env);
  const facilitator = resolveFacilitatorMode(env);
  const facilitatorConfigured = facilitator !== "invalid";
  const testnetReady = env.ENVIRONMENT === "testnet" && env.NETWORK === "eip155:84532" && payeeConfigured && publicBaseUrlConfigured && facilitatorConfigured;
  const productionReady = env.ENVIRONMENT === "production" && env.NETWORK === "eip155:8453" && payeeConfigured && facilitator === "payai" && d1Bound && publicBaseUrlConfigured;

  return {
    ok: env.ENVIRONMENT === "production" ? productionReady : testnetReady,
    service: "x402-canary", version: "0.5.0", environment: env.ENVIRONMENT, network: env.NETWORK, facilitator_mode: facilitator,
    checks: { payee_configured: payeeConfigured, public_base_url_configured: publicBaseUrlConfigured, facilitator_configured: facilitatorConfigured, d1_bound: d1Bound, offramp_verified: offrampVerified, unofframped_cap_configured: Number.isFinite(treasuryCapUsd) && treasuryCapUsd > 0 },
    treasury: { mode: offrampVerified ? "verified" : "capped", unofframped_cap_usd: treasuryCapUsd },
    gates: { testnet_ready: testnetReady, production_ready: productionReady },
  };
}
