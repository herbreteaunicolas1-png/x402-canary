import test from "node:test";
import assert from "node:assert/strict";
import { dependencyGate, releaseGate } from "../src/agent-security.ts";

function jsonResponse(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
}

test("dependency gate blocks a direct vulnerable dependency and preserves provenance", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/systems/npm/packages/demo")) return jsonResponse({ versions:[{ versionKey:{ system:"NPM", name:"demo", version:"1.0.0" }, isDefault:true }] });
    if (url.endsWith("/systems/npm/packages/demo/versions/1.0.0")) return jsonResponse({ versionKey:{ system:"NPM",name:"demo",version:"1.0.0" }, isDefault:true, licenses:["MIT"], advisoryKeys:[] });
    if (url.endsWith("/systems/npm/packages/demo/versions/1.0.0:dependencies")) return jsonResponse({ nodes:[
      { versionKey:{ system:"NPM",name:"demo",version:"1.0.0" }, relation:"SELF" },
      { versionKey:{ system:"NPM",name:"risky",version:"2.0.0" }, relation:"DIRECT" },
    ] });
    if (url === "https://api.osv.dev/v1/querybatch" && init?.method === "POST") return jsonResponse({ results:[{}, { vulns:[{ id:"GHSA-test" }] }] });
    if (url.endsWith("/v1/vulns/GHSA-test")) return jsonResponse({ id:"GHSA-test", summary:"test advisory", database_specific:{ severity:"HIGH" } });
    throw new Error(`unexpected_mock_url:${url}`);
  }) as typeof fetch;
  try {
    const result = await dependencyGate({ packages:[{ ecosystem:"npm", name:"demo", version:"1.0.0" }] });
    assert.equal(result.data.decision, "BLOCK");
    assert.equal(result.data.install_allowed, false);
    const pkg = (result.data.packages as Array<any>)[0];
    assert.equal(pkg.vulnerability_count, 1);
    assert.equal(pkg.vulnerabilities[0].relation, "DIRECT");
    assert.equal(pkg.vulnerabilities[0].severity, "high");
    assert.deepEqual(result.data.provenance, ["deps.dev v3","OSV.dev v1"]);
  } finally { globalThis.fetch = originalFetch; }
});

test("dependency gate can downgrade direct advisory to WARN but denied license remains BLOCK", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/systems/npm/packages/demo")) return jsonResponse({ versions:[{ versionKey:{ system:"NPM", name:"demo", version:"1.0.0" }, isDefault:true }] });
    if (url.endsWith("/systems/npm/packages/demo/versions/1.0.0")) return jsonResponse({ isDefault:true, licenses:["GPL-3.0"], advisoryKeys:[] });
    if (url.endsWith("/systems/npm/packages/demo/versions/1.0.0:dependencies")) return jsonResponse({ nodes:[{ versionKey:{ system:"NPM",name:"demo",version:"1.0.0" }, relation:"SELF" }] });
    if (url === "https://api.osv.dev/v1/querybatch" && init?.method === "POST") return jsonResponse({ results:[{ vulns:[{ id:"OSV-test" }] }] });
    if (url.endsWith("/v1/vulns/OSV-test")) return jsonResponse({ id:"OSV-test" });
    throw new Error(`unexpected_mock_url:${url}`);
  }) as typeof fetch;
  try {
    const result = await dependencyGate({ packages:[{ ecosystem:"npm",name:"demo",version:"1.0.0" }], policy:{ block_on_any_direct_vulnerability:false, denied_licenses:["GPL-3.0"] } });
    assert.equal(result.data.decision, "BLOCK");
  } finally { globalThis.fetch = originalFetch; }
});

test("release gate blocks secrets and destructive migrations without echoing the secret", async () => {
  const secret = "ghp_abcdefghijklmnopqrstuvwxyz1234567890";
  const result = await releaseGate({ changed_files:[
    { path:"src/config.ts", patch:`@@ -0,0 +1 @@\n+export const API_TOKEN = "${secret}"` },
    { path:"migrations/002.sql", patch:"@@ -0,0 +1 @@\n+DROP TABLE users;" },
  ] });
  assert.equal(result.data.grade, "BLOCK");
  assert.equal(result.data.ship, false);
  const findings = result.data.findings as Array<any>;
  assert.ok(findings.some((f) => f.rule === "known-secret-token-pattern" || f.rule === "literal-secret-assignment"));
  assert.ok(findings.some((f) => f.rule === "destructive-database-migration"));
  assert.equal(JSON.stringify(result).includes(secret), false);
});

test("release gate warns on unpinned action and passes a harmless diff", async () => {
  const warn = await releaseGate({ changed_files:[{ path:".github/workflows/ci.yml", patch:"@@ -1 +1 @@\n+      uses: actions/checkout@v4" }] });
  assert.equal(warn.data.grade, "WARN");
  assert.equal(warn.data.ship, true);
  const pass = await releaseGate({ changed_files:[{ path:"src/math.ts", patch:"@@ -1 +1 @@\n+export const add = (a:number,b:number) => a+b;" }] });
  assert.equal(pass.data.grade, "PASS");
  assert.equal(pass.data.ship, true);
});
