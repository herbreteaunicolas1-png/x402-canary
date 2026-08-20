import test from "node:test";
import assert from "node:assert/strict";
import { ROUTES } from "../src/catalog.ts";
import { buildOpenApi } from "../src/openapi.ts";
import { discoveryInputExample } from "../src/discovery.ts";
import { formatUsdAmount } from "../src/pricing.ts";

test("AgentCash/Bazaar discovery contract is complete for every paid operation", () => {
  const doc = buildOpenApi("https://api.example.com") as any;
  assert.equal(doc.openapi, "3.1.0");
  assert.equal(doc.info.version, "0.5.0");
  assert.ok(doc.info["x-guidance"]);
  for (const route of ROUTES) {
    const op = doc.paths[route.path]?.post;
    assert.ok(op, `missing OpenAPI operation ${route.path}`);
    assert.ok(op.requestBody?.content?.["application/json"]?.schema, `missing input schema ${route.path}`);
    assert.ok(op.responses?.["200"]?.content?.["application/json"]?.schema, `missing 200 schema ${route.path}`);
    assert.ok(op.responses?.["402"], `missing 402 response ${route.path}`);
    assert.deepEqual(op["x-payment-info"].protocols, [{ x402: {} }]);
    assert.equal(op["x-payment-info"].price.amount, formatUsdAmount(route.priceUsd));
    const sample = discoveryInputExample(route.schema);
    for (const field of (route.schema.required as string[] | undefined) ?? []) assert.ok(Object.hasOwn(sample, field), `missing sample ${route.id}.${field}`);
  }
});

test("commercial launch family contains exactly dependency and release gates", () => {
  const products = ROUTES.filter(r => r.family === "agent-security");
  assert.deepEqual(products.map(r => [r.id,r.priceUsd]), [["dependency-gate",0.015],["release-gate",0.04]]);
});
