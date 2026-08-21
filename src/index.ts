import { Hono, type Context } from "hono";
import { ROUTES } from "./catalog-authority.ts";
import { buildLlmsTxt, buildOpenApi } from "./openapi.ts";
import { getPaymentMiddleware } from "./payment.ts";
import { buildReadiness } from "./readiness.ts";
import { ledgerOuterMiddleware } from "./ledger.ts";
import { treasuryExposureGuard } from "./treasury.ts";
import { agentPreflight, cronExplain, cronValidate, dnsLookup, domainEnrich, domainNormalize, domainPreflight, earthquakesRecent, emailDomainEnrich, emailPreflight, fxConvert, fxRate, gatewayBatch, gatewayRun, hashSha256, jsonInspect, urlNormalize } from "./engines.ts";
import type { Env, Variables } from "./types.ts";
import { resolveIntent } from "./compatibility.ts";
import { assertPublicResolution, publicHttpsUrl, x402Health } from "./x402-health.ts";
import { dependencyGate, releaseGate, type DependencyGateInput, type ReleaseGateInput } from "./agent-security.ts";
import { browserContext, npmApiDiff, npmSymbolContext, type BrowserContextInput, type NpmApiDiffInput, type NpmSymbolContextInput } from "./agent-needs.ts";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();
app.use("*", ledgerOuterMiddleware);
app.use("/v1/*", treasuryExposureGuard);
app.use("/v1/*", async (c, next) => getPaymentMiddleware(c.env)(c, next));
app.get("/health", c => c.json({ok:true,service:"x402-canary",version:"0.5.0",environment:c.env.ENVIRONMENT,network:c.env.NETWORK,routes:ROUTES.length}));
app.get("/readiness", c => { const r=buildReadiness(c.env); return c.json(r,r.ok?200:503); });
app.get("/catalog", c => c.json({routes:ROUTES.map(({schema,outputExample,...r})=>r)}));
app.get("/openapi.json", c => c.json(buildOpenApi(c.env.PUBLIC_BASE_URL,c.env.MERCHANT_CONTACT_EMAIL)));
app.get("/llms.txt", c => c.text(buildLlmsTxt(c.env.PUBLIC_BASE_URL),200,{"content-type":"text/plain; charset=utf-8"}));
app.get("/skill.md", c => { const base=c.env.PUBLIC_BASE_URL.replace(/\/$/,""); return c.text(["---","name: x402-agent-context","description: Fresh external context and deterministic preflight for coding agents. Use when local evidence is insufficient.","---","","# X402 Agent Context","",`Merchant: ${base}`,"",`NPM Symbol Context: POST ${base}/v1/agent/npm-symbol-context — $0.015. Verify exact published package metadata and requested TypeScript API symbols instead of relying on model memory.`,`NPM API Diff: POST ${base}/v1/agent/npm-api-diff — $0.025. Compare public declaration symbols, engines and peer dependencies before an npm upgrade.`,`Browser Context: POST ${base}/v1/agent/browser-context — $0.03. Render a public HTTPS URL in managed Chrome and return current Markdown plus accessibility tree.`,`Dependency Gate: POST ${base}/v1/agent/dependency-gate — $0.015.`,`Release Gate: POST ${base}/v1/agent/release-gate — $0.04.`,"","Use an x402-capable buyer client such as AgentCash for discovery/payment/retry. Inspect the schema before the first paid call. Prefer free local evidence when sufficient; buy fresh context only when the question depends on external current state. Never loop paid calls."].join("\n"),200,{"content-type":"text/markdown; charset=utf-8"}); });
app.get("/llms-full.txt", c => c.text([buildLlmsTxt(c.env.PUBLIC_BASE_URL),"","## Agent usage policy","Use npm_symbol_context when exact published package metadata or a current API signature matters and local installed declarations are absent or stale.","Use npm_api_diff before an npm upgrade when the agent must know public declaration, engine or peer-dependency changes between two concrete versions.","Use browser_context when a task depends on a public JavaScript-rendered HTTPS page or the page as a browser actually sees it. Do not use it when plain HTTP/local source is sufficient.","Use dependency_gate immediately before adding or upgrading an npm/PyPI dependency when vulnerability evidence is needed.","Use release_gate before declaring deployable work complete when code, CI, deployment config, migrations, environment templates, containers, or dependency manifests changed.","Never send secrets. Never repeat a paid call without a material input/state change."].join("\n"),200,{"content-type":"text/plain; charset=utf-8"}));
app.get("/agent-skills/npm-symbol-context.md",c=>c.text(`# NPM Symbol Context\n\nUse when exact current npm package metadata or TypeScript declaration signatures are needed and local evidence is missing/stale. Call ${c.env.PUBLIC_BASE_URL.replace(/\/$/,"")}/v1/agent/npm-symbol-context through an x402-capable client. Request only the symbols needed.`,200,{"content-type":"text/markdown; charset=utf-8"}));
app.get("/agent-skills/npm-api-diff.md",c=>c.text(`# NPM API Diff\n\nUse before upgrading a concrete npm package version when migration compatibility is uncertain. Call ${c.env.PUBLIC_BASE_URL.replace(/\/$/,"")}/v1/agent/npm-api-diff with package, from_version and to_version.`,200,{"content-type":"text/markdown; charset=utf-8"}));
app.get("/agent-skills/browser-context.md",c=>c.text(`# Browser Context\n\nUse when a coding task depends on what a public JavaScript-rendered HTTPS page actually contains. Call ${c.env.PUBLIC_BASE_URL.replace(/\/$/,"")}/v1/agent/browser-context. Private/local targets are rejected. Prefer local source/plain HTTP when sufficient.`,200,{"content-type":"text/markdown; charset=utf-8"}));
app.get("/agent-skills/dependency-gate.md",c=>c.text(`# Dependency Gate\n\nTrigger before installing or upgrading npm/PyPI dependencies. Call ${c.env.PUBLIC_BASE_URL.replace(/\/$/,"")}/v1/agent/dependency-gate through an x402-capable client. Treat BLOCK as a hard stop; WARN requires review. Do not call for dependencies that are not being changed.`,200,{"content-type":"text/markdown; charset=utf-8"}));
app.get("/agent-skills/release-gate.md",c=>c.text(`# Release Gate\n\nTrigger before declaring deployable coding work complete when code/config/migrations/dependencies changed. Send bounded changed-file diff patches, not the full repository. Call ${c.env.PUBLIC_BASE_URL.replace(/\/$/,"")}/v1/agent/release-gate through an x402-capable client. BLOCK means do not ship.`,200,{"content-type":"text/markdown; charset=utf-8"}));
app.get("/.well-known/mcp.json",c=>c.json({name:"x402-agent-context",version:"0.5.0",transport:"streamable-http",endpoint:`${c.env.PUBLIC_BASE_URL.replace(/\/$/,"")}/mcp`,paidExecutions:["npm-symbol-context","npm-api-diff","browser-context","dependency-gate","release-gate"].map(id=>`${c.env.PUBLIC_BASE_URL.replace(/\/$/,"")}${ROUTES.find(r=>r.id===id)!.path}`)}));
app.post("/mcp",async c=>{ let request:Record<string,unknown>; try{request=await body(c)}catch(err){return errorResponse(c,err)} const id=request.id??null; if(request.method==="initialize")return c.json({jsonrpc:"2.0",id,result:{protocolVersion:"2025-06-18",capabilities:{tools:{}},serverInfo:{name:"x402-agent-context",version:"0.5.0"}}}); if(request.method==="tools/list")return c.json({jsonrpc:"2.0",id,result:{tools:[
{name:"npm_symbol_context",description:"When local package docs/types are missing or stale, buy exact published npm package metadata and declaration snippets for requested symbols. $0.015/call.",inputSchema:ROUTES.find(r=>r.id==="npm-symbol-context")!.schema,annotations:{readOnlyHint:true,destructiveHint:false}},
{name:"npm_api_diff",description:"Before an npm upgrade with uncertain migration impact, compare published declaration symbols, engines and peer dependencies between two exact versions. $0.025/call.",inputSchema:ROUTES.find(r=>r.id==="npm-api-diff")!.schema,annotations:{readOnlyHint:true,destructiveHint:false}},
{name:"browser_context",description:"When the task depends on a JavaScript-rendered public HTTPS page, buy a current managed-Chrome Markdown + accessibility snapshot. Private/local targets are rejected. $0.03/call.",inputSchema:ROUTES.find(r=>r.id==="browser-context")!.schema,annotations:{readOnlyHint:true,destructiveHint:false}},
{name:"dependency_gate",description:"Before installing or upgrading npm/PyPI dependencies, obtain a paid ALLOW/WARN/BLOCK preflight from deps.dev + OSV evidence.",inputSchema:ROUTES.find(r=>r.id==="dependency-gate")!.schema,annotations:{readOnlyHint:true,destructiveHint:false}},
{name:"release_gate",description:"Before declaring deployable coding work complete, obtain a paid PASS/WARN/BLOCK release preflight over changed diff lines and optional dependency deltas.",inputSchema:ROUTES.find(r=>r.id==="release-gate")!.schema,annotations:{readOnlyHint:true,destructiveHint:false}},
{name:"resolve_intent",description:"Resolve a bounded legacy compatibility intent through the existing paid x402 gateway.",inputSchema:ROUTES.find(r=>r.id==="intent-resolve")!.schema,annotations:{readOnlyHint:true,destructiveHint:false}}
]}}); if(request.method==="tools/call"){const params=request.params&&typeof request.params==="object"?request.params as Record<string,unknown>:{};const name=String(params.name??"");const routeId=name==="npm_symbol_context"?"npm-symbol-context":name==="npm_api_diff"?"npm-api-diff":name==="browser_context"?"browser-context":name==="dependency_gate"?"dependency-gate":name==="release_gate"?"release-gate":name==="resolve_intent"?"intent-resolve":"";const route=ROUTES.find(r=>r.id===routeId);if(!route)return c.json({jsonrpc:"2.0",id,error:{code:-32602,message:"Unknown tool"}});return c.json({jsonrpc:"2.0",id,error:{code:-32042,message:"x402 payment required",data:{endpoint:`${c.env.PUBLIC_BASE_URL.replace(/\/$/,"")}${route.path}`,method:"POST",priceUsd:route.priceUsd,openapi:`${c.env.PUBLIC_BASE_URL.replace(/\/$/,"")}/openapi.json`,hint:"Use an x402-capable client such as AgentCash/Coinbase Agentic Wallet or call the paid HTTP resource with x402 v2."}}});} return c.json({jsonrpc:"2.0",id,error:{code:-32601,message:"Method not found"}});});
const FAVICON_PNG=Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="),c=>c.charCodeAt(0)); app.get("/favicon.ico",c=>c.body(FAVICON_PNG,200,{"content-type":"image/png","cache-control":"public, max-age=86400"}));
async function body(c:Context<{Bindings:Env;Variables:Variables}>):Promise<Record<string,unknown>>{const len=Number(c.req.header("content-length")??"0");if(len>300_000)throw new Error("payload_too_large");let parsed:unknown;try{parsed=await c.req.json()}catch{throw new Error("invalid_json")}if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw new Error("json_object_required");return parsed as Record<string,unknown>;}
function errorResponse(c:Context<{Bindings:Env;Variables:Variables}>,err:unknown){const message=err instanceof Error?err.message:"internal_error";if(message==="upstream_timeout")return c.json({error:message},504);if(message.startsWith("upstream_")||message==="rate_not_found"||message.startsWith("browser_run_")||message.startsWith("target_dns_"))return c.json({error:message},502);if(message.startsWith("production_"))return c.json({error:"payment_configuration_unavailable"},503);return c.json({error:message},400);}
type PaidHandler=(b:Record<string,unknown>,env:Env)=>Promise<unknown>|unknown;
const PAID_HANDLERS:Readonly<Record<string,PaidHandler>>=Object.freeze({
"/v1/fx/rate":b=>fxRate(String(b.base??""),String(b.quote??"")),
"/v1/exchange-rates":b=>fxRate(String(b.base??""),String(b.quote??"")),
"/v1/fx/convert":b=>fxConvert(String(b.base??""),String(b.quote??""),Number(b.amount)),
"/v1/currency-convert":b=>fxConvert(String(b.base??""),String(b.quote??""),Number(b.amount)),
"/v1/earthquakes/recent":b=>earthquakesRecent(b.min_magnitude===undefined?0:Number(b.min_magnitude),b.limit===undefined?25:Number(b.limit)),
"/v1/seismic/recent":b=>earthquakesRecent(b.min_magnitude===undefined?0:Number(b.min_magnitude),b.limit===undefined?25:Number(b.limit)),
"/v1/cron/validate":b=>cronValidate(String(b.expression??"")),
"/v1/cron/explain":b=>cronExplain(String(b.expression??"")),
"/v1/cron-parse":b=>cronExplain(String(b.expression??"")),
"/v1/domain/normalize":b=>domainNormalize(String(b.domain??"")),
"/v1/url/normalize":b=>urlNormalize(String(b.url??"")),
"/v1/email/preflight":b=>emailPreflight(String(b.email??"")),
"/v1/email/domain-check":b=>emailPreflight(String(b.email??"")),
"/v1/domain/dns":b=>dnsLookup(String(b.domain??""),Array.isArray(b.types)?b.types.map(String):["A","AAAA","MX"]),
"/v1/domain/preflight":b=>domainPreflight(String(b.domain??"")),
"/v1/json/inspect":b=>jsonInspect(b.value),
"/v1/json/validate":b=>jsonInspect(b.value),
"/v1/hash/sha256":b=>hashSha256(String(b.text??"")),
"/v1/text/fingerprint":b=>hashSha256(String(b.text??"")),
"/v1/agent/preflight":b=>agentPreflight(String(b.kind??""),String(b.value??"")),
"/v1/domain/enrich":b=>domainEnrich(String(b.domain??"")),
"/v1/domain/mail-security":b=>domainEnrich(String(b.domain??"")),
"/v1/email/domain-enrich":b=>emailDomainEnrich(String(b.email??"")),
"/v1/gateway/run":b=>gatewayRun(String(b.tool??""),b.input),
"/v1/gateway/batch":b=>gatewayBatch(b.calls),
"/v1/intent/resolve":b=>resolveIntent(String(b.intent??""),b.input),
"/v1/agent/dependency-gate":b=>dependencyGate(b as unknown as DependencyGateInput),
"/v1/agent/release-gate":b=>releaseGate(b as unknown as ReleaseGateInput),
"/v1/x402/health":b=>x402Health(String(b.url??""),String(b.method??"GET")),
"/v1/agent/npm-symbol-context":b=>npmSymbolContext(b as unknown as NpmSymbolContextInput),
"/v1/agent/npm-api-diff":b=>npmApiDiff(b as unknown as NpmApiDiffInput),
"/v1/agent/browser-context":async(b,env)=>{const target=publicHttpsUrl(String(b.url??""));await assertPublicResolution(new URL(target).hostname);return browserContext(env,{...b,url:target} as unknown as BrowserContextInput)}
});
const canonicalPaths=new Set(ROUTES.map(route=>route.path));for(const path of Object.keys(PAID_HANDLERS))if(!canonicalPaths.has(path))throw new Error(`paid_handler_without_catalog_route:${path}`);for(const route of ROUTES){const handler=PAID_HANDLERS[route.path];if(!handler)throw new Error(`catalog_route_without_paid_handler:${route.path}`);app.post(route.path,async c=>{try{return c.json(await handler(await body(c),c.env))}catch(err){return errorResponse(c,err)}});}app.notFound(c=>c.json({error:"not_found"},404));app.onError((err,c)=>errorResponse(c,err));export default app;
