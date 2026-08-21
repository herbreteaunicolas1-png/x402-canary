import test from "node:test";
import assert from "node:assert/strict";
import { recommendNeed } from "../src/need-router.ts";

test("need router recommends exact npm symbol context when current API evidence is missing", () => {
  const out = recommendNeed({ task: "I need the exact current TypeScript API signature for an npm package symbol before coding", max_price_usd: 0.02, local_evidence_sufficient: false });
  assert.equal(out.next_action, "BUY_RECOMMENDED_TOOL");
  assert.equal((out.recommendation as any).route_id, "npm-symbol-context");
  assert.equal((out.recommendation as any).price_usd, 0.015);
});

test("need router recommends browser context for rendered JavaScript page state", () => {
  const out = recommendNeed({ task: "The fix depends on the DOM of a JavaScript rendered web page in a real browser", max_price_usd: 0.05 });
  assert.equal(out.next_action, "BUY_RECOMMENDED_TOOL");
  assert.equal((out.recommendation as any).route_id, "browser-context");
});

test("need router never sells duplicate evidence when local evidence is sufficient", () => {
  const out = recommendNeed({ task: "README wording only and local diff is complete", local_evidence_sufficient: true, max_price_usd: 0.05 });
  assert.equal(out.next_action, "NO_PURCHASE_LOCAL_EVIDENCE_SUFFICIENT");
  assert.equal(out.recommendation, null);
});

test("need router respects buyer budget instead of forcing an uneconomic purchase", () => {
  const out = recommendNeed({ task: "Compare breaking changes before an npm package upgrade", max_price_usd: 0.01 });
  assert.equal(out.next_action, "UNMET_BUDGET");
  assert.equal(out.matched_route_id, "npm-api-diff");
});
