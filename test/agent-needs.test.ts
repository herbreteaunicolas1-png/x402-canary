import test from "node:test";
import assert from "node:assert/strict";
import { declarationSnippets, exportedDeclarationMap, normalizeNpmPackageName } from "../src/agent-needs.ts";

test("npm package names are bounded and normalized without accepting URLs", () => {
  assert.equal(normalizeNpmPackageName("hono"), "hono");
  assert.equal(normalizeNpmPackageName("@scope/pkg"), "@scope/pkg");
  assert.throws(() => normalizeNpmPackageName("https://npmjs.com/hono"), /invalid_npm_package/);
  assert.throws(() => normalizeNpmPackageName("bad package"), /invalid_npm_package/);
});

test("published declaration helpers recover requested symbols and export deltas deterministically", () => {
  const files = new Map<string,string>([["package/index.d.ts", "export interface Alpha { x: string }\nexport declare function beta(v: number): string;\nexport { Gamma as Delta };\n"]]);
  const snippets = declarationSnippets(files, ["Alpha", "beta"]);
  assert.equal(snippets.length, 2);
  assert.deepEqual(snippets.map(s => s.symbol), ["Alpha", "beta"]);
  const exports = exportedDeclarationMap(files);
  assert.ok(exports.has("Alpha"));
  assert.ok(exports.has("beta"));
  assert.ok(exports.has("Delta"));
});
