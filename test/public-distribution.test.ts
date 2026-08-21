import test from "node:test";
import assert from "node:assert/strict";
import { distributionManifest, landingHtml, skillMarkdown } from "../src/public-distribution.ts";

test("public distribution exposes the exact buyer bridge and three need-driven products", () => {
  const base = "https://api.example.com";
  const d = distributionManifest(base) as any;
  assert.equal(d.status, "public");
  assert.equal(d.paid_route_count, 32);
  assert.equal(d.buyer_bridge.provider, "AgentCash");
  assert.match(d.buyer_bridge.install_commands.claude_code, /agentcash/);
  assert.match(d.buyer_bridge.install_commands.codex, /agentcash/);
  assert.deepEqual(d.capabilities.slice(0,3).map((x:any) => [x.id,x.price_usd]), [
    ["npm-symbol-context",0.015],
    ["npm-api-diff",0.025],
    ["browser-context",0.03],
  ]);
  assert.match(skillMarkdown(base), /set up https:\/\/agentcash\.dev\/skill\.md/i);
  assert.match(skillMarkdown(base), /npm docs/);
  assert.match(skillMarkdown(base), /breaking changes/);
  assert.match(skillMarkdown(base), /browser snapshot/);
  assert.match(landingHtml(base), /Claude Code, Codex, Gemini CLI/);
});
