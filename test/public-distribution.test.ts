import test from "node:test";
import assert from "node:assert/strict";
import { distributionManifest, landingHtml, skillMarkdown } from "../src/public-distribution.ts";

test("public distribution exposes free need routing, buyer bridge and three need-driven products", () => {
  const base = "https://api.example.com";
  const d = distributionManifest(base) as any;
  assert.equal(d.status, "public");
  assert.equal(d.paid_route_count, 32);
  assert.equal(d.free_need_router.endpoint, `${base}/agent/find-tool`);
  assert.equal(d.free_need_router.mcp_tool, "find_paid_tool");
  assert.equal(d.free_need_router.price_usd, 0);
  assert.equal(d.free_need_router.raw_task_stored, false);
  assert.equal(d.buyer_bridge.provider, "AgentCash");
  assert.match(d.buyer_bridge.install_commands.claude_code_agentcash, /agentcash/);
  assert.match(d.buyer_bridge.install_commands.codex_agentcash, /agentcash/);
  assert.match(d.buyer_bridge.install_commands.claude_code_direct_mcp, /\/mcp$/);
  assert.match(d.buyer_bridge.install_commands.gemini_cli_direct_mcp, /\/mcp$/);
  assert.deepEqual(d.capabilities.slice(0,3).map((x:any) => [x.id,x.price_usd]), [
    ["npm-symbol-context",0.015],
    ["npm-api-diff",0.025],
    ["browser-context",0.03],
  ]);
  const skill = skillMarkdown(base);
  assert.match(skill, /find_paid_tool/);
  assert.match(skill, /set up https:\/\/agentcash\.dev\/skill\.md/i);
  assert.match(skill, /npm docs/);
  assert.match(skill, /breaking changes/);
  assert.match(skill, /browser snapshot/);
  const landing = landingHtml(base);
  assert.match(landing, /Free router:/);
  assert.match(landing, /agent\/find-tool/);
  assert.match(landing, /AgentCash/);
});
