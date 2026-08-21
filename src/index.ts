import { Hono, type Context } from "hono";
import { ROUTES } from "./catalog-authority.ts";
import { buildLlmsTxt, buildOpenApi } from "./openapi.ts";
import { getPaymentMiddleware } from "./payment.ts";
import { buildReadiness } from "./readiness.ts";
import { attributionChannel, ledgerOuterMiddleware } from "./ledger.ts";
import { treasuryExposureGuard } from "./treasury.ts";
import { agentPreflight, cronExplain, cronValidate, dnsLookup, domainEnrich, domainNormalize, domainPreflight, earthquakesRecent, emailDomainEnrich, emailPreflight, fxConvert, fxRate, gatewayBatch, gatewayRun, hashSha256, jsonInspect, urlNormalize } from "./engines.ts";
import type { Env, Variables } from "./types.ts";
import { resolveIntent } from "./compatibility.ts";
import { assertPublicResolution, publicHttpsUrl, x402Health } from "./x402-health.ts";
import { dependencyGate, releaseGate, type DependencyGateInput, type ReleaseGateInput } from "./agent-security.ts";
import { browserContext, npmApiDiff, npmSymbolContext, type BrowserContextInput, type NpmApiDiffInput, type NpmSymbolContextInput } from "./agent-needs.ts";
import { distributionManifest, landingHtml, robotsTxt, sitemapXml, skillMarkdown } from "./public-distribution.ts";
import { findPaidTool, NEED_ROUTER_SCHEMA } from "./need-router.ts";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();
app.use("*", ledgerOuterMiddleware);
app.use("/v1/*", treasuryExposureGuard);
app.use("/v1/*", async (c, next) => getPaymentMiddleware(c.env)(c, next));

app.get("/", c => c.html(landingHtml(c.env.PUBLIC_BASE_URL)));
app.get("/health", c => c.json({ ok: true, service: "x402-canary", version: "0.5.0", environment: c.env.ENVIRONMENT, network: c.env.NETWORK, routes: ROUTES.length, free_need_router: true }));
app.get("/readiness", c => { const r = buildReadiness(c.env); return c.json(r, r.ok ? 200 : 503); });
app.get("/catalog", c => c.json({ routes: ROUTES.map(({ schema, outputExample, ...r }) => r) }));
app.get("/openapi.json", c => c.json(buildOpenApi(c.env.PUBLIC_BASE_URL, c.env.MERCHANT_CONTACT_EMAIL)));
app.get("/distribution", c => c.json(distributionManifest(c.env.PUBLIC_BASE_URL)));
app.get("/robots.txt", c => c.text(robotsTxt(c.env.PUBLIC_BASE_URL), 200, { "content-type": "text/plain; charset=utf-8" }));
app.get("/sitemap.xml", c => c.text(sitemapXml(c.env.PUBLIC_BASE_URL), 200, { "content-type": "application/xml; charset=utf-8" }));
app.get("/llms.txt", c => c.text(buildLlmsTxt(c.env.PUBLIC_BASE_URL), 200, { "content-type": "text/plain; charset=utf-8" }));
app.get("/skill.md", c => c.text(skillMarkdown(c.env.PUBLIC_BASE_URL), 200, { "content-type": "text/markdown; charset=utf-8" }));
app.get("/llms-full.txt", c => c.text([
  buildLlmsTxt(c.env.PUBLIC_BASE_URL),
  "",
  "## Free need router",
  `Before guessing which paid capability to use, POST ${c.env.PUBLIC_BASE_URL.replace(/\/$/, "")}/agent/find-tool or call MCP tool find_paid_tool. It is free, does not store the raw task, and returns BUY_RECOMMENDED_TOOL only when an external capability matches the need and fits the stated budget. Unmatched needs are logged as product-discovery evidence instead of forcing a purchase.`,
  "",
  "## Buyer bridge",
  "If AgentCash is available, use its search, check_endpoint_schema and fetch tools. If it is not installed, set up https://agentcash.dev/skill.md first. AgentCash is the payment/discovery bridge used by Claude Code, Codex, Gemini CLI and other MCP-capable agents.",
  "",
  "## Agent usage policy",
  "Use npm_symbol_context when exact published package metadata or a current API signature matters and local installed declarations are absent or stale.",
  "Use npm_api_diff before an npm upgrade when the agent must know public declaration, engine or peer-dependency changes between two concrete versions.",
  "Use browser_context when a task depends on a public JavaScript-rendered HTTPS page or the page as a browser actually sees it. Do not use it when plain HTTP/local source is sufficient.",
  "Use dependency_gate immediately before adding or upgrading an npm/PyPI dependency when vulnerability evidence is needed.",
  "Use release_gate before declaring deployable work complete when code, CI, deployment config, migrations, environment templates, containers, or dependency manifests changed.",
  "Never send secrets. Never repeat a paid call without a material input/state change."
].join("\n"), 200, { "content-type": "text/plain; charset=utf-8" }));

app.get("/agent-skills/npm-symbol-context.md", c => c.text(`# NPM Symbol Context\n\nUse when exact current npm package metadata or TypeScript declaration signatures are needed and local evidence is missing/stale. Call ${c.env.PUBLIC_BASE_URL.replace(/\/$/, "")}/v1/agent/npm-symbol-context through an x402-capable client. Request only the symbols needed.`, 200, { "content-type": "text/markdown; charset=utf-8" }));
app.get("/agent-skills/npm-api-diff.md", c => c.text(`# NPM API Diff\n\nUse before upgrading a concrete npm package version when migration compatibility is uncertain. Call ${c.env.PUBLIC_BASE_URL.replace(/\/$/, "")}/v1/agent/npm-api-diff with package, from_version and to_version.`, 200, { "content-type": "text/markdown; charset=utf-8" }));
app.get("/agent-skills/browser-context.md", c => c.text(`# Browser Context\n\nUse when a coding task depends on what a public JavaScript-rendered HTTPS page actually contains. Call ${c.env.PUBLIC_BASE_URL.replace(/\/$/, "")}/v1/agent/browser-context. Private/local targets are rejected. Prefer local source/plain HTTP when sufficient.`, 200, { "content-type": "text/markdown; charset=utf-8" }));
app.get("/agent-skills/dependency-gate.md", c => c.text(`# Dependency Gate\n\nTrigger before installing or upgrading npm/PyPI dependencies. Call ${c.env.PUBLIC_BASE_URL.replace(/\/$/, "")}/v1/agent/dependency-gate through an x402-capable client. Treat BLOCK as a hard stop; WARN requires review. Do not call for dependencies that are not being changed.`, 200, { "content-type": "text/markdown; charset=utf-8" }));
app.get("/agent-skills/release-gate.md", c => c.text(`# Release Gate\n\nTrigger before declaring deployable coding work complete when code/config/migrations/dependencies changed. Send bounded changed-file diff patches, not the full repository. Call ${c.env.PUBLIC_BASE_URL.replace(/\/$/, "")}/v1/agent/release-gate through an x402-capable client. BLOCK means do not ship.`, 200, { "content-type": "text/markdown; charset=utf-8" }));

app.post("/agent/find-tool", async c => {
  try {
    const result = await findPaidTool(c.env, await body(c), attributionChannel(c.req.raw.headers));
    return c.json(result);
  } catch (err) {
    return errorResponse(c, err);
  }
});

app.get("/.well-known/mcp.json", c => {
  const base = c.env.PUBLIC_BASE_URL.replace(/\/$/, "");
  return c.json({
    name: "x402-agent-context",
    version: "0.5.0",
    transport: "streamable-http",
    endpoint: `${base}/mcp`,
    freeNeedRouter: { tool: "find_paid_tool", endpoint: `${base}/agent/find-tool`, rawTaskStored: false },
    buyerBridge: { provider: "AgentCash", installPrompt: "Set up https://agentcash.dev/skill.md", distribution: `${base}/distribution` },
    paidExecutions: ["npm-symbol-context", "npm-api-diff", "browser-context", "dependency-gate", "release-gate"].map(id => `${base}${ROUTES.find(r => r.id === id)!.path}`)
  });
});

app.post("/mcp", async c => {
  let request: Record<string, unknown>;
  try { request = await body(c); } catch (err) { return errorResponse(c, err); }
  const id = request.id ?? null;
  if (request.method === "initialize") return c.json({ jsonrpc: "2.0", id, result: { protocolVersion: "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "x402-agent-context", version: "0.5.0" } } });
  if (request.method === "tools/list") return c.json({ jsonrpc: "2.0", id, result: { tools: [
    { name: "find_paid_tool", description: "FREE need router. Use first when an engineering task may require external/current evidence. It records only a task hash/category, never raw task text, and returns a paid recommendation only when the capability matches and fits the stated budget; otherwise it records an unmet need.", inputSchema: NEED_ROUTER_SCHEMA, annotations: { readOnlyHint: true, destructiveHint: false } },
    { name: "npm_symbol_context", description: "When local npm docs/types are missing or stale, buy exact published TypeScript API signatures and package symbols. $0.015/call.", inputSchema: ROUTES.find(r => r.id === "npm-symbol-context")!.schema, annotations: { readOnlyHint: true, destructiveHint: false } },
    { name: "npm_api_diff", description: "Before an npm package upgrade, compare breaking changes and migration-relevant TypeScript API, engine and peer-dependency differences. $0.025/call.", inputSchema: ROUTES.find(r => r.id === "npm-api-diff")!.schema, annotations: { readOnlyHint: true, destructiveHint: false } },
    { name: "browser_context", description: "When the task depends on a browser snapshot of a JavaScript-rendered web page, buy current Markdown plus accessibility tree. Private/local targets are rejected. $0.03/call.", inputSchema: ROUTES.find(r => r.id === "browser-context")!.schema, annotations: { readOnlyHint: true, destructiveHint: false } },
    { name: "dependency_gate", description: "Before installing or upgrading npm/PyPI dependencies, obtain a paid ALLOW/WARN/BLOCK preflight from deps.dev + OSV evidence.", inputSchema: ROUTES.find(r => r.id === "dependency-gate")!.schema, annotations: { readOnlyHint: true, destructiveHint: false } },
    { name: "release_gate", description: "Before declaring deployable coding work complete, obtain a paid PASS/WARN/BLOCK release preflight over changed diff lines and optional dependency deltas.", inputSchema: ROUTES.find(r => r.id === "release-gate")!.schema, annotations: { readOnlyHint: true, destructiveHint: false } },
    { name: "resolve_intent", description: "Resolve a bounded legacy compatibility intent through the existing paid x402 gateway.", inputSchema: ROUTES.find(r => r.id === "intent-resolve")!.schema, annotations: { readOnlyHint: true, destructiveHint: false } }
  ] } });
  if (request.method === "tools/call") {
    const params = request.params && typeof request.params === "object" ? request.params as Record<string, unknown> : {};
    const name = String(params.name ?? "");
    const args = params.arguments && typeof params.arguments === "object" && !Array.isArray(params.arguments) ? params.arguments as Record<string, unknown> : {};
    if (name === "find_paid_tool") {
      try {
        const routed = await findPaidTool(c.env, args, attributionChannel(c.req.raw.headers));
        const data = routed.data && typeof routed.data === "object" ? routed.data as Record<string, unknown> : {};
        return c.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: data } });
      } catch (err) {
        const message = err instanceof Error ? err.message : "need_router_error";
        return c.json({ jsonrpc: "2.0", id, error: { code: -32602, message } });
      }
    }
    const routeId = name === "npm_symbol_context" ? "npm-symbol-context" : name === "npm_api_diff" ? "npm-api-diff" : name === "browser_context" ? "browser-context" : name === "dependency_gate" ? "dependency-gate" : name === "release_gate" ? "release-gate" : name === "resolve_intent" ? "intent-resolve" : "";
    const route = ROUTES.find(r => r.id === routeId);
    if (!route) return c.json({ jsonrpc: "2.0", id, error: { code: -32602, message: "Unknown tool" } });
    return c.json({ jsonrpc: "2.0", id, error: { code: -32042, message: "x402 payment required", data: { endpoint: `${c.env.PUBLIC_BASE_URL.replace(/\/$/, "")}${route.path}`, method: "POST", priceUsd: route.priceUsd, openapi: `${c.env.PUBLIC_BASE_URL.replace(/\/$/, "")}/openapi.json`, agentcashSkill: "https://agentcash.dev/skill.md", hint: "Use AgentCash search/check/fetch or another x402-capable client to pay and retry the HTTP resource." } } });
  }
  return c.json({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } });
});

const FAVICON_PNG = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="), c => c.charCodeAt(0));
app.get("/favicon.ico", c => c.body(FAVICON_PNG, 200, { "content-type": "image/png", "cache-control": "public, max-age=86400" }));

async function body(c: Context<{ Bindings: Env; Variables: Variables }>): Promise<Record<string, unknown>> {
  const len = Number(c.req.header("content-length") ?? "0");
  if (len > 300_000) throw new Error("payload_too_large");
  let parsed: unknown;
  try { parsed = await c.req.json(); } catch { throw new Error("invalid_json"); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("json_object_required");
  return parsed as Record<string, unknown>;
}

function errorResponse(c: Context<{ Bindings: Env; Variables: Variables }>, err: unknown) {
  const message = err instanceof Error ? err.message : "internal_error";
  if (message === "upstream_timeout") return c.json({ error: message }, 504);
  if (message.startsWith("upstream_") || message === "rate_not_found" || message.startsWith("browser_run_") || message.startsWith("target_dns_")) return c.json({ error: message }, 502);
  if (message.startsWith("production_")) return c.json({ error: "payment_configuration_unavailable" }, 503);
  return c.json({ error: message }, 400);
}

type PaidHandler = (b: Record<string, unknown>, env: Env) => Promise<unknown> | unknown;
const PAID_HANDLERS: Readonly<Record<string, PaidHandler>> = Object.freeze({
  "/v1/fx/rate": b => fxRate(String(b.base ?? ""), String(b.quote ?? "")),
  "/v1/exchange-rates": b => fxRate(String(b.base ?? ""), String(b.quote ?? "")),
  "/v1/fx/convert": b => fxConvert(String(b.base ?? ""), String(b.quote ?? ""), Number(b.amount)),
  "/v1/currency-convert": b => fxConvert(String(b.base ?? ""), String(b.quote ?? ""), Number(b.amount)),
  "/v1/earthquakes/recent": b => earthquakesRecent(b.min_magnitude === undefined ? 0 : Number(b.min_magnitude), b.limit === undefined ? 25 : Number(b.limit)),
  "/v1/seismic/recent": b => earthquakesRecent(b.min_magnitude === undefined ? 0 : Number(b.min_magnitude), b.limit === undefined ? 25 : Number(b.limit)),
  "/v1/cron/validate": b => cronValidate(String(b.expression ?? "")),
  "/v1/cron/explain": b => cronExplain(String(b.expression ?? "")),
  "/v1/cron-parse": b => cronExplain(String(b.expression ?? "")),
  "/v1/domain/normalize": b => domainNormalize(String(b.domain ?? "")),
  "/v1/url/normalize": b => urlNormalize(String(b.url ?? "")),
  "/v1/email/preflight": b => emailPreflight(String(b.email ?? "")),
  "/v1/email/domain-check": b => emailPreflight(String(b.email ?? "")),
  "/v1/domain/dns": b => dnsLookup(String(b.domain ?? ""), Array.isArray(b.types) ? b.types.map(String) : ["A", "AAAA", "MX"]),
  "/v1/domain/preflight": b => domainPreflight(String(b.domain ?? "")),
  "/v1/json/inspect": b => jsonInspect(b.value),
  "/v1/json/validate": b => jsonInspect(b.value),
  "/v1/hash/sha256": b => hashSha256(String(b.text ?? "")),
  "/v1/text/fingerprint": b => hashSha256(String(b.text ?? "")),
  "/v1/agent/preflight": b => agentPreflight(String(b.kind ?? ""), String(b.value ?? "")),
  "/v1/domain/enrich": b => domainEnrich(String(b.domain ?? "")),
  "/v1/domain/mail-security": b => domainEnrich(String(b.domain ?? "")),
  "/v1/email/domain-enrich": b => emailDomainEnrich(String(b.email ?? "")),
  "/v1/gateway/run": b => gatewayRun(String(b.tool ?? ""), b.input),
  "/v1/gateway/batch": b => gatewayBatch(b.calls),
  "/v1/intent/resolve": b => resolveIntent(String(b.intent ?? ""), b.input),
  "/v1/agent/dependency-gate": b => dependencyGate(b as unknown as DependencyGateInput),
  "/v1/agent/release-gate": b => releaseGate(b as unknown as ReleaseGateInput),
  "/v1/x402/health": b => x402Health(String(b.url ?? ""), String(b.method ?? "GET")),
  "/v1/agent/npm-symbol-context": b => npmSymbolContext(b as unknown as NpmSymbolContextInput),
  "/v1/agent/npm-api-diff": b => npmApiDiff(b as unknown as NpmApiDiffInput),
  "/v1/agent/browser-context": async (b, env) => { const target = publicHttpsUrl(String(b.url ?? "")); await assertPublicResolution(new URL(target).hostname); return browserContext(env, { ...b, url: target } as unknown as BrowserContextInput); }
});

const canonicalPaths = new Set(ROUTES.map(route => route.path));
for (const path of Object.keys(PAID_HANDLERS)) if (!canonicalPaths.has(path)) throw new Error(`paid_handler_without_catalog_route:${path}`);
for (const route of ROUTES) {
  const handler = PAID_HANDLERS[route.path];
  if (!handler) throw new Error(`catalog_route_without_paid_handler:${route.path}`);
  app.post(route.path, async c => { try { return c.json(await handler(await body(c), c.env)); } catch (err) { return errorResponse(c, err); } });
}

app.notFound(c => c.json({ error: "not_found" }, 404));
app.onError((err, c) => errorResponse(c, err));
export default app;
