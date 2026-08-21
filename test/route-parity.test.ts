import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ROUTES as LEGACY_ROUTES } from "../src/catalog.ts";
import { ROUTES } from "../src/catalog-authority.ts";
import { buildOpenApi } from "../src/openapi.ts";

test("legacy 29-route portfolio is preserved and effective authority adds exactly three need-driven routes", () => {
  assert.equal(LEGACY_ROUTES.length, 29);
  assert.equal(ROUTES.length, 32);
  assert.equal(new Set(ROUTES.map(r => `${r.method} ${r.path}`)).size, 32);
  assert.deepEqual(ROUTES.slice(0, 29).map(r => r.path), LEGACY_ROUTES.map(r => r.path));
  assert.deepEqual(ROUTES.slice(29).map(r => r.id), ["npm-symbol-context","npm-api-diff","browser-context"]);

  const index = readFileSync(new URL("../src/index.ts", import.meta.url), "utf8");
  assert.match(index, /for\(const route of ROUTES\)/);
  assert.match(index, /PAID_HANDLERS\[route\.path\]/);
  const handlerPaths = [...index.matchAll(/"(\/v1\/[^"\n]+)":(?:async\(b,env\)|\(b,env\)|b)=>/g)].map(m => m[1]).sort();
  assert.deepEqual(handlerPaths, ROUTES.map(r => r.path).sort());

  const doc:any = buildOpenApi("https://api.example.com");
  assert.deepEqual(Object.keys(doc.paths).sort(), ROUTES.map(r=>r.path).sort());

  const payment = readFileSync(new URL("../src/payment.ts", import.meta.url), "utf8");
  assert.match(payment, /catalog-authority\.ts/);
  assert.match(payment, /for \(const route of ROUTES\)/);
  assert.match(payment, /formatX402Price\(route\.priceUsd\)/);
  assert.match(payment, /bazaarResourceServerExtension/);
});
