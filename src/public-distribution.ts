import { ROUTES } from "./catalog-authority.ts";

const PRIMARY_IDS = ["npm-symbol-context", "npm-api-diff", "browser-context", "dependency-gate", "release-gate"] as const;

function baseOf(baseUrl: string): string { return baseUrl.replace(/\/$/, ""); }

export function distributionManifest(baseUrl: string) {
  const base = baseOf(baseUrl);
  const capabilities = PRIMARY_IDS.map((id) => {
    const route = ROUTES.find((r) => r.id === id);
    if (!route) throw new Error(`distribution_route_missing:${id}`);
    return { id: route.id, path: route.path, url: `${base}${route.path}`, price_usd: route.priceUsd, description: route.description };
  });
  return {
    status: "public",
    service: "x402-agent-context",
    origin: base,
    paid_route_count: ROUTES.length,
    free_need_router: {
      endpoint: `${base}/agent/find-tool`,
      mcp_tool: "find_paid_tool",
      price_usd: 0,
      raw_task_stored: false,
      purpose: "Ask first when a coding agent lacks external/current evidence. Returns a paid recommendation only when capability match and buyer budget justify it; otherwise records an unmet need without inventing a purchase."
    },
    discovery: {
      openapi: `${base}/openapi.json`,
      catalog: `${base}/catalog`,
      llms: `${base}/llms.txt`,
      llms_full: `${base}/llms-full.txt`,
      skill: `${base}/skill.md`,
      mcp_metadata: `${base}/.well-known/mcp.json`,
      mcp_endpoint: `${base}/mcp`
    },
    buyer_bridge: {
      provider: "AgentCash",
      dynamic_catalog: true,
      install_prompt: "Set up https://agentcash.dev/skill.md",
      direct_skill_prompt: `Set up ${base}/skill.md`,
      direct_mcp_endpoint: `${base}/mcp`,
      install_commands: {
        claude_code_agentcash: "npx agentcash install --client claude-code",
        codex_agentcash: "npx agentcash install --client codex",
        generic_agentcash: "npx agentcash install",
        claude_code_direct_mcp: `claude mcp add --transport http x402-agent-context ${base}/mcp`,
        gemini_cli_direct_mcp: `gemini mcp add --transport http x402-agent-context ${base}/mcp`
      },
      search_queries: [
        "npm docs TypeScript API package symbols",
        "npm package upgrade breaking changes migration API diff",
        "browser snapshot rendered web page JavaScript accessibility"
      ]
    },
    capabilities,
    policy: {
      free_need_router_first_when_external_evidence_is_uncertain: true,
      local_evidence_first: true,
      inspect_schema_and_price_before_paid_call: true,
      no_seller_funded_self_traffic: true,
      no_repeat_paid_call_without_material_change: true
    }
  };
}

export function skillMarkdown(baseUrl: string): string {
  const base = baseOf(baseUrl);
  return [
    "---",
    "name: x402-agent-context",
    "description: Free need-to-tool routing plus fresh npm docs and TypeScript API signatures, npm upgrade breaking-change diffs, browser snapshots, dependency risk and release checks for coding agents; pay only for the external evidence actually needed.",
    "---",
    "",
    "# X402 Agent Context",
    "",
    "Use this skill when a coding task may depend on external/current state that model memory or the local repository cannot reliably provide.",
    "",
    "## Step 1 — route the need for free",
    `Before choosing a paid tool, call the free MCP tool \`find_paid_tool\` or POST ${base}/agent/find-tool. Describe the engineering task, the missing external capability if known, whether local evidence is sufficient, and the maximum price worth paying.`,
    "The free router does not store the raw task. It stores a hash plus need category, budget, channel and recommended route so repeated unmet demand can drive the next products.",
    "If it returns NO_PURCHASE_LOCAL_EVIDENCE_SUFFICIENT, do not buy anything. If it returns UNMET_NEED or UNMET_BUDGET, do not invent a purchase. If it returns BUY_RECOMMENDED_TOOL, inspect that route's schema and price and buy one call if the evidence is still needed.",
    "",
    "## Buyer bridge",
    "If AgentCash tools are already available, use its `search`, `check_endpoint_schema`, and `fetch` tools for x402 discovery/payment/retry. If AgentCash is not installed, set up https://agentcash.dev/skill.md. The direct MCP endpoint is also published at this service's `/.well-known/mcp.json`.",
    "",
    "Never buy a call just because this skill is present. Prefer local installed types, local tests, repository files and ordinary HTTP when they answer the question reliably.",
    "",
    "## Paid capabilities",
    `- NPM Symbol Context — $0.015 — ${base}/v1/agent/npm-symbol-context — search intent: npm docs, TypeScript API, package documentation, exact package symbols. Use when exact published package/version signatures matter and local types/docs are absent or stale.`,
    `- NPM API Diff — $0.025 — ${base}/v1/agent/npm-api-diff — search intent: npm upgrade, breaking changes, migration diff, peer dependencies. Use before a concrete version upgrade when compatibility is uncertain.`,
    `- Browser Context — $0.03 — ${base}/v1/agent/browser-context — search intent: browser snapshot, rendered web page, JavaScript page, accessibility tree. Use when the answer depends on what a public HTTPS page actually renders after JavaScript.`,
    `- Dependency Gate — $0.015 — ${base}/v1/agent/dependency-gate — use when fresh vulnerability/dependency evidence is materially useful before install/upgrade.`,
    `- Release Gate — $0.04 — ${base}/v1/agent/release-gate — use for release-relevant code/config/migration changes when deterministic preflight adds value.`,
    "",
    "## Discovery",
    `Free need router: ${base}/agent/find-tool`,
    `MCP: ${base}/mcp`,
    `OpenAPI: ${base}/openapi.json`,
    `Catalog: ${base}/catalog`,
    `Distribution manifest: ${base}/distribution`,
    "",
    "Do not send secrets, private repository contents, private/local URLs, or personal data. Never loop paid calls; rerun only after a material input or external-state change."
  ].join("\n");
}

export function landingHtml(baseUrl: string): string {
  const base = baseOf(baseUrl);
  const cards = PRIMARY_IDS.slice(0, 3).map((id) => {
    const r = ROUTES.find((route) => route.id === id)!;
    return `<li><strong>${r.id}</strong> — $${r.priceUsd}/call — <code>${r.path}</code><br>${escapeHtml(r.description)}</li>`;
  }).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Coding Agent Context APIs</title><meta name="description" content="Free need-to-tool routing plus pay-per-call npm docs and TypeScript API signatures, npm breaking-change diffs, JavaScript-rendered browser snapshots and deterministic coding-agent checks via AgentCash/x402."><link rel="service-desc" href="${base}/openapi.json"></head><body><main><h1>Coding Agent Context APIs</h1><p>Start free: tell the need router what external evidence the coding task lacks. It recommends a paid call only when one of the available capabilities matches and fits the buyer's budget.</p><p><strong>Free router:</strong> <code>POST ${base}/agent/find-tool</code> or MCP tool <code>find_paid_tool</code>. Raw task text is not stored.</p><ul>${cards}</ul><h2>Give an agent access</h2><p><code>Set up ${base}/skill.md</code></p><p>If it does not already have AgentCash, first use <code>Set up https://agentcash.dev/skill.md</code>. Direct MCP: <code>${base}/mcp</code>.</p><p><a href="${base}/distribution">Distribution manifest</a> · <a href="${base}/openapi.json">OpenAPI</a> · <a href="${base}/llms.txt">LLM index</a></p></main></body></html>`;
}

export function robotsTxt(baseUrl: string): string {
  const base = baseOf(baseUrl);
  return `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`;
}

export function sitemapXml(baseUrl: string): string {
  const base = baseOf(baseUrl);
  const paths = ["/", "/distribution", "/skill.md", "/openapi.json", "/llms.txt"];
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((p) => `<url><loc>${base}${p}</loc></url>`).join("")}</urlset>`;
}

const HTML_ESCAPES: Readonly<Record<string, string>> = Object.freeze({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" });
function escapeHtml(value: string): string {
  return value.replace(/[&<>\"]/g, (ch) => HTML_ESCAPES[ch] ?? ch);
}
