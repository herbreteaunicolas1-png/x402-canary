import type { Env } from "./types.ts";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const TESTNET_FACILITATOR_URL = "https://x402.org/facilitator";
export const PAYAI_FACILITATOR_URL = "https://facilitator.payai.network";

export type FacilitatorMode = "x402-testnet" | "payai";

function normalizedUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const u = new URL(value);
    return `${u.protocol}//${u.host}${u.pathname.replace(/\/+$/, "")}`;
  } catch { return undefined; }
}

export function facilitatorMode(env: Env): FacilitatorMode {
  const explicit = normalizedUrl(env.FACILITATOR_URL);
  if (env.ENVIRONMENT === "production") {
    if (explicit !== PAYAI_FACILITATOR_URL) throw new Error("production_requires_payai_facilitator");
    return "payai";
  }
  if (explicit && explicit !== TESTNET_FACILITATOR_URL && explicit !== PAYAI_FACILITATOR_URL) throw new Error("testnet_facilitator_not_allowlisted");
  return explicit === PAYAI_FACILITATOR_URL ? "payai" : "x402-testnet";
}

export function facilitatorUrl(env: Env): string {
  return facilitatorMode(env) === "payai" ? PAYAI_FACILITATOR_URL : TESTNET_FACILITATOR_URL;
}

export function assertProductionPaymentConfig(env: Env): void {
  if (env.ENVIRONMENT !== "production") return;
  if (env.NETWORK !== "eip155:8453") throw new Error("production_requires_base_mainnet");
  if (!/^0x[a-fA-F0-9]{40}$/.test(env.PAY_TO) || env.PAY_TO.toLowerCase() === ZERO_ADDRESS) throw new Error("production_requires_real_payee");
  if (!/^https:\/\//.test(env.PUBLIC_BASE_URL ?? "")) throw new Error("production_requires_https_public_base_url");
  if (!env.DB) throw new Error("production_requires_d1_ledger");
  facilitatorMode(env);
}
