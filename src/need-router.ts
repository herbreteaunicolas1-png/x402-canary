import { ROUTES } from "./catalog-authority.ts";
import type { Env } from "./types.ts";
import { sha256Hex } from "./util.ts";

export const NEED_ROUTER_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    task: { type: "string", minLength: 8, maxLength: 1600, description: "Short description of the engineering task and the external evidence that may be missing." },
    missing_capability: { type: "string", maxLength: 320, description: "Optional capability the agent believes it lacks. Describe the capability, not a vendor." },
    max_price_usd: { type: "number", minimum: 0, maximum: 1, default: 0.05, description: "Maximum price worth paying for one external evidence/action call." },
    freshness_seconds: { type: "integer", minimum: 0, maximum: 31536000, default: 0 },
    local_evidence_sufficient: { type: "boolean", default: false, description: "True when repository/local tools already answer the question reliably; this suppresses purchase recommendations." }
  },
  required: ["task"],
  additionalProperties: false
};

const PROMOTED_IDS = ["npm-symbol-context", "npm-api-diff", "browser-context", "dependency-gate", "release-gate"] as const;
type PromotedId = typeof PROMOTED_IDS[number];

const KEYWORDS: Readonly<Record<PromotedId, readonly string[]>> = Object.freeze({
  "npm-symbol-context": ["npm docs", "package docs", "typescript api", "type signature", "api signature", "declaration", "d.ts", "package symbol", "current api", "exact symbol", "library api"],
  "npm-api-diff": ["npm upgrade", "package upgrade", "breaking change", "migration", "version diff", "api diff", "peer dependency", "peer dependencies", "upgrade compatibility"],
  "browser-context": ["browser", "rendered page", "javascript page", "dom", "accessibility tree", "browser snapshot", "client rendered", "hydrated page", "web page state"],
  "dependency-gate": ["vulnerability", "vulnerabilities", "osv", "dependency risk", "package security", "cve", "malicious package", "license risk"],
  "release-gate": ["release", "deploy", "deployment", "migration sql", "github action", "secret leak", "release safety", "ship", "production change"]
});

const CATEGORY: Readonly<Record<PromotedId, string>> = Object.freeze({
  "npm-symbol-context": "fresh-package-api-context",
  "npm-api-diff": "package-upgrade-compatibility",
  "browser-context": "rendered-browser-state",
  "dependency-gate": "dependency-risk-evidence",
  "release-gate": "release-risk-evidence"
});

export interface NeedRouterInput {
  task: string;
  missing_capability?: string;
  max_price_usd?: number;
  freshness_seconds?: number;
  local_evidence_sufficient?: boolean;
}

function cleanText(value: unknown, max: number): string {
  const text = String(value ?? "").trim().replace(/\s+/g, " ");
  if (text.length > max) throw new Error("need_router_text_too_long");
  return text;
}

function validatedInput(raw: Record<string, unknown>): Required<Pick<NeedRouterInput, "task" | "max_price_usd" | "freshness_seconds" | "local_evidence_sufficient">> & { missing_capability: string } {
  const task = cleanText(raw.task, 1600);
  if (task.length < 8) throw new Error("need_router_task_required");
  const missing = cleanText(raw.missing_capability, 320);
  const maxPrice = raw.max_price_usd === undefined ? 0.05 : Number(raw.max_price_usd);
  if (!Number.isFinite(maxPrice) || maxPrice < 0 || maxPrice > 1) throw new Error("need_router_invalid_budget");
  const freshness = raw.freshness_seconds === undefined ? 0 : Number(raw.freshness_seconds);
  if (!Number.isInteger(freshness) || freshness < 0 || freshness > 31_536_000) throw new Error("need_router_invalid_freshness");
  return { task, missing_capability: missing, max_price_usd: maxPrice, freshness_seconds: freshness, local_evidence_sufficient: raw.local_evidence_sufficient === true };
}

function normalizedSearchText(input: { task: string; missing_capability: string }): string {
  return `${input.task} ${input.missing_capability}`.toLowerCase().replace(/[^a-z0-9.+/#_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function keywordScore(text: string, id: PromotedId): number {
  let score = 0;
  for (const keyword of KEYWORDS[id]) {
    if (text.includes(keyword)) score += keyword.includes(" ") ? 4 : 2;
  }
  if (id === "npm-symbol-context" && /\bnpm\b/.test(text) && /(docs?|types?|signature|symbol|api)/.test(text)) score += 4;
  if (id === "npm-api-diff" && /\bnpm\b/.test(text) && /(upgrade|migrat|breaking|version)/.test(text)) score += 4;
  if (id === "browser-context" && /(javascript|browser|dom|render)/.test(text) && /(page|site|url|web)/.test(text)) score += 4;
  if (id === "dependency-gate" && /(dependency|package)/.test(text) && /(security|vulnerab|cve|risk)/.test(text)) score += 4;
  if (id === "release-gate" && /(release|deploy|ship|production)/.test(text) && /(risk|migration|secret|ci|action|config)/.test(text)) score += 4;
  return score;
}

export function recommendNeed(raw: Record<string, unknown>): Record<string, unknown> {
  const input = validatedInput(raw);
  if (input.local_evidence_sufficient) {
    return { next_action: "NO_PURCHASE_LOCAL_EVIDENCE_SUFFICIENT", unmet_need: false, recommendation: null, reason: "The agent declared local evidence sufficient; paying for duplicate evidence would add cost without information gain.", normalized: { max_price_usd: input.max_price_usd, freshness_seconds: input.freshness_seconds } };
  }

  const text = normalizedSearchText(input);
  const ranked = PROMOTED_IDS.map((id) => {
    const route = ROUTES.find((candidate) => candidate.id === id);
    if (!route) throw new Error(`need_router_route_missing:${id}`);
    return { id, route, score: keywordScore(text, id) };
  }).sort((a, b) => b.score - a.score || a.route.priceUsd - b.route.priceUsd);
  const best = ranked[0]!;

  if (best.score <= 0) {
    return { next_action: "UNMET_NEED", unmet_need: true, recommendation: null, reason: "No promoted paid capability matches the stated missing evidence strongly enough. Record this as product-discovery evidence instead of inventing a purchase.", normalized: { max_price_usd: input.max_price_usd, freshness_seconds: input.freshness_seconds } };
  }
  if (best.route.priceUsd > input.max_price_usd) {
    return { next_action: "UNMET_BUDGET", unmet_need: true, recommendation: null, matched_route_id: best.id, matched_price_usd: best.route.priceUsd, reason: "A matching external capability exists but exceeds the buyer's stated maximum economic value.", normalized: { max_price_usd: input.max_price_usd, freshness_seconds: input.freshness_seconds } };
  }

  return {
    next_action: "BUY_RECOMMENDED_TOOL",
    unmet_need: false,
    recommendation: {
      route_id: best.id,
      path: best.route.path,
      price_usd: best.route.priceUsd,
      description: best.route.description,
      match_score: best.score,
      need_category: CATEGORY[best.id]
    },
    reason: "The task depends on external evidence that matches a promoted capability and the price is within the buyer's stated budget.",
    normalized: { max_price_usd: input.max_price_usd, freshness_seconds: input.freshness_seconds }
  };
}

function safeChannel(value: string): string {
  const normalized = value.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9:._-]{0,63}$/.test(normalized) ? normalized : "direct";
}

export async function findPaidTool(env: Env, raw: Record<string, unknown>, channelInput: string): Promise<Record<string, unknown>> {
  const input = validatedInput(raw);
  const recommendation = recommendNeed(raw);
  const signalId = crypto.randomUUID();
  const taskHash = await sha256Hex(input.task.toLowerCase());
  const rec = recommendation.recommendation && typeof recommendation.recommendation === "object" ? recommendation.recommendation as Record<string, unknown> : null;
  const routeId = rec && typeof rec.route_id === "string" ? rec.route_id : (typeof recommendation.matched_route_id === "string" ? recommendation.matched_route_id : null);
  const category = rec && typeof rec.need_category === "string" ? rec.need_category : (recommendation.next_action === "UNMET_BUDGET" ? "unmet-budget" : recommendation.next_action === "UNMET_NEED" ? "unmet-capability" : "local-sufficient");
  const channel = safeChannel(channelInput);

  if (env.DB) {
    try {
      await env.DB.prepare(`INSERT INTO agent_need_signals (signal_id, occurred_at, channel, need_category, recommended_route_id, max_price_usd, freshness_seconds, local_evidence_sufficient, task_hash, task_length) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(signalId, new Date().toISOString(), channel, category, routeId, input.max_price_usd, input.freshness_seconds, input.local_evidence_sufficient ? 1 : 0, taskHash, input.task.length).run();
    } catch (error) {
      console.error("need_signal_write_failed", { signalId, channel, error: String(error) });
    }
  }

  return {
    data: {
      need_signal_id: signalId,
      raw_task_stored: false,
      channel,
      ...recommendation,
      ...(rec ? { buyer_instruction: "Inspect the recommended route schema and current x402 price, then buy exactly one call if the external evidence is still required. Do not loop paid calls." } : {})
    },
    meta: { engine: "need-router", source: "deterministic_need_to_paid_capability_match", fetched_at: new Date().toISOString(), cache_ttl_s: 0 }
  };
}
