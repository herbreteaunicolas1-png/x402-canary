import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ROUTES } from "../src/catalog.ts";
import { buildOpenApi } from "../src/openapi.ts";

test("catalog router OpenAPI and paywall derive from one exact 29-route authority", () => {
  assert.equal(ROUTES.length, 29);
  assert.equal(new Set(ROUTES.map(r => `${r.method} ${r.path}`)).size, 29);
  const index = readFileSync(new URL("../src/index.ts", import.meta.url), "utf8");
  assert.match(index, /for\(const route of ROUTES\)/);
  assert.match(index, /PAID_HANDLERS\[route\.path\]/);
  const handlerPaths = [...index.matchAll(/"(\/v1\/[^"\n]+)":b=>/g)].map(m => m[1]).sort();
  assert.deepEqual(handlerPaths, ROUTES.map(r => r.path).sort());
  const doc:any = buildOpenApi("https://api.example.com");
  assert.deepEqual(Object.keys(doc.paths).sort(), ROUTES.map(r=>r.path).sort());
  const payment = readFileSync(new URL("../src/payment.ts", import.meta.url), "utf8");
  assert.match(payment, /for \(const route of ROUTES\)/);
  assert.match(payment, /formatX402Price\(route\.priceUsd\)/);
  assert.match(payment, /bazaarResourceServerExtension/);
});
