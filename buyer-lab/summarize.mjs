import fs from "node:fs";

const path = process.argv[2] || "results/latest.json";
const raw = JSON.parse(fs.readFileSync(path, "utf8"));
const rows = raw.results || raw.table?.body || raw.eval?.results || [];

function providerName(row) {
  return row.provider?.label || row.provider?.id || row.provider || row.providerId || "unknown";
}
function testVars(row) {
  return row.vars || row.testCase?.vars || row.test?.vars || {};
}
function outputOf(row) {
  return row.response?.output ?? row.output ?? row.response ?? null;
}
function collectToolNames(value, out = []) {
  if (value == null) return out;
  if (Array.isArray(value)) { for (const v of value) collectToolNames(v, out); return out; }
  if (typeof value === "object") {
    const fn = value.function;
    if (fn && typeof fn === "object" && typeof fn.name === "string") out.push(fn.name);
    if (typeof value.name === "string" && (value.type === "tool_use" || value.type === "function")) out.push(value.name);
    for (const v of Object.values(value)) collectToolNames(v, out);
  }
  return out;
}
const PAID = new Set(["dependency_gate_x402","release_gate_x402"]);
const counts = new Map();
const misses = [];
for (const row of rows) {
  const p = providerName(row);
  const vars = testVars(row);
  const names = [...new Set(collectToolNames(outputOf(row)))];
  const text = typeof outputOf(row) === "string" ? outputOf(row) : JSON.stringify(outputOf(row));
  const chosen = names.length ? names : (/NO_TOOL/i.test(text || "") ? ["NO_TOOL"] : ["UNPARSED"]);
  if (!counts.has(p)) counts.set(p, {total:0, paid:0, dep:0, rel:0, noTool:0, local:0, unparsed:0});
  const c = counts.get(p); c.total++;
  if (chosen.some(n => PAID.has(n))) c.paid++;
  if (chosen.includes("dependency_gate_x402")) c.dep++;
  if (chosen.includes("release_gate_x402")) c.rel++;
  if (chosen.includes("NO_TOOL")) c.noTool++;
  if (chosen.some(n => n.endsWith("_local"))) c.local++;
  if (chosen.includes("UNPARSED")) c.unparsed++;
  const expected = vars.expected_preference;
  if (expected && expected !== "free_or_paid") {
    const ok = expected === "both_paid"
      ? chosen.includes("dependency_gate_x402") && chosen.includes("release_gate_x402")
      : expected === "no_paid_tool"
      ? !chosen.some(n => PAID.has(n))
      : chosen.includes(expected);
    if (!ok) misses.push({provider:p, case_id:vars.case_id, expected, chosen, task:vars.task});
  }
}
console.log("=== X402 BUYER LAB ===");
for (const [p,c] of counts) {
  const pct = c.total ? (100*c.paid/c.total).toFixed(1) : "0.0";
  console.log(`${p}: rows=${c.total} paid_any=${c.paid} (${pct}%) dependency=${c.dep} release=${c.rel} local=${c.local} no_tool=${c.noTool} unparsed=${c.unparsed}`);
}
console.log(`EXPECTATION_MISSES=${misses.length}`);
for (const m of misses.slice(0,50)) console.log(JSON.stringify(m));
