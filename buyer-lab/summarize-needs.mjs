import fs from "node:fs";

const path = process.argv[2] || "results/needs-latest.json";
const raw = JSON.parse(fs.readFileSync(path, "utf8"));
const rows = raw.results || raw.table?.body || raw.eval?.results || [];

function providerName(row) {
  return row.provider?.label || row.provider?.id || row.provider || row.providerId || "unknown";
}
function outputOf(row) {
  return row.response?.output ?? row.output ?? row.response ?? null;
}
function parseJson(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string") return null;
  const stripped = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try { return JSON.parse(stripped); } catch {}
  const start = stripped.indexOf("{"); const end = stripped.lastIndexOf("}");
  if (start >= 0 && end > start) { try { return JSON.parse(stripped.slice(start, end + 1)); } catch {} }
  return null;
}
function bucket(text) {
  const s = text.toLowerCase();
  if (/(browser|render|dom|page|accessibility|visual)/.test(s)) return "rendered-browser-state";
  if (/(package|npm|sdk|library|signature|declaration|api reference|documentation|docs)/.test(s)) return "current-library-api-context";
  if (/(log|trace|error event|observab|production error|runtime)/.test(s)) return "production-observability";
  if (/(ci|workflow|runner|check)/.test(s)) return "remote-ci-state";
  if (/(database|schema state|row count|data distribution|migration state)/.test(s)) return "production-database-state";
  if (/(dns|mx|spf|dkim|dmarc)/.test(s)) return "live-dns-mail-state";
  if (/(oauth|provider config|transaction|payment provider|job state|account state)/.test(s)) return "external-account-state";
  if (/(service status|outage|health)/.test(s)) return "external-service-status";
  if (/(live api|response schema|openapi|webhook|http response)/.test(s)) return "live-api-contract-state";
  if (/(pull request|github|issue|review|labels)/.test(s)) return "repository-host-state";
  if (/(vulnerab|advisory|cve)/.test(s)) return "current-vulnerability-data";
  return "other";
}
function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a,b)=>a-b);
  const i = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[i] : (sorted[i-1] + sorted[i]) / 2;
}

const stats = new Map();
const providerStats = new Map();
let parsed = 0; let noNeed = 0;
for (const row of rows) {
  const provider = providerName(row);
  const parsedOutput = parseJson(outputOf(row));
  if (!parsedOutput) continue;
  parsed++;
  const needs = Array.isArray(parsedOutput.external_needs) ? parsedOutput.external_needs : [];
  if (!needs.length) noNeed++;
  if (!providerStats.has(provider)) providerStats.set(provider,{rows:0,needs:0,buckets:new Map()});
  const ps = providerStats.get(provider); ps.rows++;
  for (const need of needs.slice(0,3)) {
    if (!need || typeof need !== "object") continue;
    const capability = String(need.capability ?? "");
    const missing = String(need.missing_evidence ?? "");
    const key = bucket(`${capability} ${missing}`);
    if (!stats.has(key)) stats.set(key,{count:0,providers:new Set(),prices:[],latencies:[],freshness:[],examples:[]});
    const s = stats.get(key); s.count++; s.providers.add(provider);
    const price = Number(need.max_price_usd); if (Number.isFinite(price) && price >= 0) s.prices.push(price);
    const latency = Number(need.latency_tolerance_ms); if (Number.isFinite(latency) && latency >= 0) s.latencies.push(latency);
    const freshness = Number(need.freshness_seconds); if (Number.isFinite(freshness) && freshness >= 0) s.freshness.push(freshness);
    if (s.examples.length < 3) s.examples.push({capability,trigger:String(need.trigger??""),missing_evidence:missing});
    ps.needs++; ps.buckets.set(key,(ps.buckets.get(key)??0)+1);
  }
}

const ranking = [...stats.entries()].map(([capability,s])=>({
  capability,
  mentions:s.count,
  providers:[...s.providers],
  provider_count:s.providers.size,
  median_max_price_usd:Number(median(s.prices).toFixed(4)),
  median_latency_tolerance_ms:Math.round(median(s.latencies)),
  median_freshness_seconds:Math.round(median(s.freshness)),
  examples:s.examples
})).sort((a,b)=>b.provider_count-a.provider_count || b.mentions-a.mentions || b.median_max_price_usd-a.median_max_price_usd);

const provider_summary = Object.fromEntries([...providerStats.entries()].map(([provider,s])=>[provider,{rows:s.rows,needs:s.needs,buckets:Object.fromEntries([...s.buckets.entries()].sort((a,b)=>b[1]-a[1]))}]));
const report={rows_seen:rows.length,parsed_rows:parsed,no_external_need_rows:noNeed,provider_summary,ranking};
console.log(JSON.stringify(report,null,2));
