import { createLocalJWKSet, compactVerify } from "jose";

export type XyntheraEnvironment = "sandbox" | "production";

export type XyntheraOptions = {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
};

export type GuardInput = {
  request_id?: string;
  country_code?: string;
  environment?: XyntheraEnvironment;
  requested_credentials: string[];
  registered_intended_use: {
    credentials: string[];
    [key: string]: unknown;
  };
  certificate?: {
    status?: "valid" | "unknown" | "expired" | "revoked" | "invalid";
    not_after?: string;
    [key: string]: unknown;
  };
  registry_snapshot?: Record<string, unknown>;
  required_trust_roles?: string[];
  require_trust_state?: boolean;
  require_verifier_context?: boolean;
  verifier_context?: {
    vendor?: string;
    product?: string;
    version?: string;
    deployment_id?: string;
    policy_version?: string;
    policy_hash?: string;
  };
};

export type WatchInput = {
  watch_type?: "registry" | "certificate" | "intended_use";
  target_uri?: string;
  rp_profile_id?: string;
  interval_minutes?: number;
  country_code?: string;
  business_identifier?: string;
};

export type RegistrationInput = {
  country_code: string;
  legal_name: string;
  business_identifier?: string;
  service_identifier?: string;
  support_uri?: string;
  support_email?: string;
  support_phone?: string;
  registry_uri?: string;
  uses_intermediary?: boolean;
  is_intermediary?: boolean;
  intended_uses?: Array<Record<string, unknown>>;
};

export class XyntheraApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(`Xynthera AI API error ${status}`);
    this.name = "XyntheraApiError";
    this.status = status;
    this.body = body;
  }
}

export class XyntheraAI {
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly fetchImpl: typeof fetch;

  constructor(options: XyntheraOptions) {
    if (!options.apiKey?.trim()) throw new Error("Xynthera API key is required");
    this.apiKey = options.apiKey.trim();
    this.baseUrl = (options.baseUrl ?? "https://pfxxzsnboehxsefyajml.supabase.co/functions/v1").replace(/\/$/, "");
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("content-type", "application/json");
    headers.set("x-api-key", this.apiKey);

    const response = await this.fetchImpl(this.baseUrl + path, { ...init, headers });
    const text = await response.text();

    let body: unknown = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }

    if (!response.ok) throw new XyntheraApiError(response.status, body);
    return body as T;
  }

  health = <T = unknown>() =>
    this.request<T>("/xynthera-ai-eudi/health");

  guard = {
    evaluate: <T = unknown>(input: GuardInput) =>
      this.request<T>("/xynthera-ai-guard/v1/evaluate", {
        method: "POST",
        body: JSON.stringify(input)
      })
  };

  watch = {
    create: <T = unknown>(input: WatchInput) =>
      this.request<T>("/xynthera-ai-eudi/v1/watch", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    list: <T = unknown>(limit = 50) =>
      this.request<T>(`/xynthera-ai-eudi/v1/watches?limit=${encodeURIComponent(String(limit))}`),
    events: <T = unknown>(limit = 50, since?: string) => {
      const q = new URLSearchParams({ limit: String(limit) });
      if (since) q.set("since", since);
      return this.request<T>(`/xynthera-ai-eudi/v1/events?${q}`);
    }
  };

  provider = {
    watch: <T = unknown>(input: Omit<WatchInput, "watch_type">) =>
      this.request<T>("/xynthera-ai-eudi/v1/providers/watch", {
        method: "POST",
        body: JSON.stringify(input)
      })
  };

  registration = {
    validate: <T = unknown>(input: Record<string, unknown>) =>
      this.request<T>("/xynthera-ai-registration/v1/validate", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    preflight: <T = unknown>(input: RegistrationInput) =>
      this.request<T>("/xynthera-ai-eudi/v1/registration/check", {
        method: "POST",
        body: JSON.stringify(input)
      })
  };

  webhooks = {
    create: <T = unknown>(input: { url: string; event_types?: string[] }) =>
      this.request<T>("/xynthera-ai-eudi/v1/webhooks", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    list: <T = unknown>(limit = 50) =>
      this.request<T>(`/xynthera-ai-eudi/v1/webhooks?limit=${encodeURIComponent(String(limit))}`),
    deliveries: <T = unknown>(limit = 50) =>
      this.request<T>(`/xynthera-ai-eudi/v1/webhook-deliveries?limit=${encodeURIComponent(String(limit))}`)
  };

  usage = {
    get: <T = unknown>() => this.request<T>("/xynthera-ai-eudi/v1/usage")
  };

  async jwks<T = unknown>(): Promise<T> {
    const response = await this.fetchImpl(this.baseUrl + "/xynthera-ai-eudi/jwks.json");
    if (!response.ok) throw new XyntheraApiError(response.status, await response.text());
    return await response.json() as T;
  }

  async verifyReceipt(compactJws: string) {
    const jwksResponse = await this.fetchImpl(this.baseUrl + "/xynthera-ai-eudi/jwks.json");
    if (!jwksResponse.ok) throw new XyntheraApiError(jwksResponse.status, await jwksResponse.text());

    const jwks = await jwksResponse.json();
    const verified = await compactVerify(compactJws, createLocalJWKSet(jwks as any));
    return {
      protectedHeader: verified.protectedHeader,
      payload: JSON.parse(new TextDecoder().decode(verified.payload))
    };
  }
}

export default XyntheraAI;
