export interface Env {
  ENVIRONMENT: "testnet" | "production";
  NETWORK: "eip155:84532" | "eip155:8453";
  PAY_TO: string;
  PUBLIC_BASE_URL: string;
  FACILITATOR_URL?: string;
  MERCHANT_CONTACT_EMAIL?: string;
  OFFRAMP_VERIFIED?: "true" | "false";
  UNOFFRAMPED_USDC_CAP?: string;
  BROWSER?: BrowserRun;
  DB?: D1Database;
}

export interface Variables {
  requestId: string;
}

export interface EngineMeta {
  engine: string;
  source: string;
  source_url?: string;
  fetched_at: string;
  cache_ttl_s: number;
}

export interface EngineResponse<T> {
  data: T;
  meta: EngineMeta;
}

export interface SettlementResponse {
  success: boolean;
  transaction?: string;
  network?: string;
  payer?: string;
  amount?: string;
  errorReason?: string;
}
