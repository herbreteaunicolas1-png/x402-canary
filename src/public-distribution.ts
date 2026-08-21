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
    discovery: {
      openapi: `${base}/openapi.json`,
      catalog: `${base}/catalog`,
      llms: `${base}/llms.txt`,
      llms_full: `${base}/llms-full.txt`,
      skill: `${base}/skill.md`,
      mcp_metadata: `${base}/.well-known/mcp.json`,
    },
    buyer_bridge: {
      provider: "AgentCash",
      dynamic_catalog: true,
      install_prompt: "Set up https://agentcash.dev/skill.md",
      direct_skill_prompt: `Set up ${base}/skill.md`,
      install_commands: {
        claude_code: "npx agentcash install --client claude-code",
        codex: "npx agentcash install --client codex",
        generic_mcp: "npx agentcash install",
      },
      search_queries: [
        "npm docs TypeScript API package symbols",
        "npm package upgrade breaking changes migration API diff",
        "browser snapshot rendered web page JavaScript accessibility",
      ],
    },
    capabilities,
    policy: {
      local_evidence_first: true,
      inspect_schema_and_price_before_paid_call: true,
      no_seller_funded_self_traffic: true,
      no_repeat_paid_call_without_material_change: true,
    },
  };
}

export function skillMarkdown(baseUrl: string): string {
  const base = baseOf(baseUrl);
  return [
    "---",
    "name: x402-agent-context",
    "description: Fresh npm docs and TypeScript API signatures, npm upgrade breaking-change diffs, and real JavaScript browser snapshots for coding agents; pay per call with AgentCash/x402 only when local evidence is insufficient.",
    "---",
    "",
    "# X402 Agent Context",
    "",
    "Use this skill when a coding task depends on current external state that model memory or the local repository cannot reliably provide.",
    "",
    "## Buyer bridge",
    "If AgentCash tools are already available, use its `search`, `check_endpoint_schema`, and `fetch` tools. If AgentCash is not installed, set up https://agentcash.dev/skill.md first. AgentCash handles x402 discovery, payment and retry underneath Claude Code, Codex, Gemini CLI and other MCP-capable agents.",
    "",
    "Never buy a call just because this skill is present. Prefer local installed types, local tests, repository files and ordinary HTTP when they answer the question reliably. Check schema and price before the first paid call.",
    "",
    "## Paid capabilities",
    `- NPM Symbol Context — $0.015 — ${base}/v1/agent/npm-symbol-context — search intent: npm docs, TypeScript API, package documentation, exact package symbols. Use when exact published package/version signatures matter and local types/docs are absent or stale.`,
    `- NPM API Diff — $0.025 — ${base}/v1/agent/npm-api-diff — search intent: npm upgrade, breaking changes, migration diff, peer dependencies. Use before a concrete version upgrade when compatibility is uncertain.`,
    `- Browser Context — $0.03 — ${base}/v1/agent/browser-context — search intent: browser snapshot, rendered web page, JavaScript page, accessibility tree. Use when the answer depends on what a public HTTPS page actually renders after JavaScript.`,
    `- Dependency Gate — $0.015 — ${base}/v1/agent/dependency-gate — use only when fresh vulnerability/dependency evidence is materially useful before install/upgrade.`,
    `- Release Gate — $0.04 — ${base}/v1/agent/release-gate — use only for release-relevant code/config/migration changes when deterministic preflight adds value.`,
    "",
    "## Discovery",
    `OpenAPI: ${base}/openapi.json`,
    `Catalog: ${base}/catalog`,
    `Distribution manifest: ${base}/distribution`,
    "",
    "Do not send secrets, private repository contents, private/local URLs, or personal data. Never loop paid calls; rerun only after a material input or external-state change.",
  ].join("\n");
}

export function landingHtml(baseUrl: string): string {
  const base = baseOf(baseUrl);
  const cards = PRIMARY_IDS.slice(0, 3).map((id) => {
    const r = ROUTES.find((route) => route.id === id)!;
    return `<li><strong>${r.id}</strong> — $${r.priceUsd}/call — <code>${r.path}</code><br>${escapeHtml(r.description)}</li>`;
  }).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Coding Agent Context APIs</title><meta name="description" content="Pay-per-call npm docs and TypeScript API signatures, npm breaking-change diffs, and JavaScript-rendered browser snapshots for Claude Code, Codex, Gemini CLI and other agents via AgentCash/x402."><link rel="service-desc" href="${base}/openapi.json"></head><body><main><h1>Coding Agent Context APIs</h1><p>Fresh external context for coding agents, payable per call with AgentCash/x402 on Base. No account or vendor API key.</p><ul>${cards}</ul><h2>Give an agent access</h2><p><code>Set up ${base}/skill.md</code></p><p>If it does not already have AgentCash, first use <code>Set up https://agentcash.dev/skill.md</code>.</p><p><a href="${base}/distribution">Distribution manifest</a> · <a href="${base}/openapi.json">OpenAPI</a> · <a href="${base}/llms.txt">LLM index</a></p></main></body></html>`;
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
