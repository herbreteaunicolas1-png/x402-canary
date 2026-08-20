import type { EngineResponse } from "./types.ts";

const FETCH_TIMEOUT_MS = 7000;
const MAX_PACKAGES = 5;
const MAX_GRAPH_NODES = 300;
const MAX_FILES = 40;
const MAX_PATCH_CHARS = 32_000;
const MAX_TOTAL_PATCH_CHARS = 240_000;

type Ecosystem = "npm" | "pypi";
type Decision = "ALLOW" | "WARN" | "BLOCK";
type Severity = "critical" | "high" | "medium" | "low" | "unknown";

export interface DependencyRequest { ecosystem: Ecosystem; name: string; version?: string; }
export interface DependencyPolicy { block_on_any_direct_vulnerability?: boolean; fail_on_deprecated?: boolean; denied_licenses?: string[]; }
export interface DependencyGateInput { packages: DependencyRequest[]; policy?: DependencyPolicy; }
interface DepsVersionKey { system?: string; name?: string; version?: string }
interface DepsNode { versionKey?: DepsVersionKey; relation?: string; errors?: string[] }
interface DepsPackageResponse { versions?: Array<{ versionKey?: DepsVersionKey; isDefault?: boolean }> }
interface DepsVersionResponse { versionKey?: DepsVersionKey; isDefault?: boolean; isDeprecated?: boolean; deprecatedReason?: string; licenses?: string[]; advisoryKeys?: Array<{ id?: string }>; }
interface DepsDependenciesResponse { nodes?: DepsNode[]; error?: string; errors?: unknown[] }
interface OsvBatchResponse { results?: Array<{ vulns?: Array<{ id?: string; modified?: string }> }> }
interface OsvVuln { id?: string; aliases?: string[]; summary?: string; database_specific?: { severity?: string }; ecosystem_specific?: { severity?: string }; severity?: Array<{ type?: string; score?: string }>; }

function meta(engine: string, source: string, ttl: number) { return { engine, source, source_url: "https://deps.dev/", fetched_at: new Date().toISOString(), cache_ttl_s: ttl }; }
function normalizedEcosystem(value: unknown): Ecosystem { const v = String(value ?? "").trim().toLowerCase(); if (v === "npm") return "npm"; if (v === "pypi" || v === "python") return "pypi"; throw new Error("unsupported_package_ecosystem"); }
function validatePackageName(ecosystem: Ecosystem, value: unknown): string { const name = String(value ?? "").trim(); if (!name || name.length > 214) throw new Error("invalid_package_name"); if (ecosystem === "npm") { if (!/^(?:@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*|[a-z0-9][a-z0-9._-]*)$/i.test(name)) throw new Error("invalid_package_name"); } else if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name)) throw new Error("invalid_package_name"); return name; }
function validateVersion(value: unknown): string | undefined { if (value === undefined || value === null || String(value).trim() === "") return undefined; const version = String(value).trim(); if (version.length > 100 || /[\s\\/?#]/.test(version)) throw new Error("invalid_package_version"); return version; }
function depsSystem(ecosystem: Ecosystem): string { return ecosystem === "npm" ? "npm" : "pypi"; }
function osvEcosystem(ecosystem: Ecosystem): string { return ecosystem === "npm" ? "npm" : "PyPI"; }

async function fetchJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try { const response = await fetch(url, { ...init, signal: controller.signal }); if (response.status === 404) throw new Error("package_or_version_not_found"); if (!response.ok) throw new Error(`upstream_http_${response.status}`); return await response.json() as T; }
  catch (error) { if (error instanceof Error && (error.message === "package_or_version_not_found" || error.message.startsWith("upstream_http_"))) throw error; if (error instanceof DOMException && error.name === "AbortError") throw new Error("upstream_timeout"); throw new Error("upstream_unavailable"); }
  finally { clearTimeout(timer); }
}

function uniqueVersionNodes(nodes: DepsNode[], root: { ecosystem: Ecosystem; name: string; version: string }) {
  const seen = new Set<string>(); const out: Array<{ ecosystem: Ecosystem; name: string; version: string; relation: "SELF" | "DIRECT" | "INDIRECT" }> = [];
  const push = (ecosystem: Ecosystem, name: string, version: string, relation: "SELF" | "DIRECT" | "INDIRECT") => { const key = `${ecosystem}\u0000${name.toLowerCase()}\u0000${version}`; if (seen.has(key)) return; seen.add(key); out.push({ ecosystem, name, version, relation }); };
  push(root.ecosystem, root.name, root.version, "SELF");
  for (const node of nodes) { const vk = node.versionKey; const system = String(vk?.system ?? "").toLowerCase(); const eco: Ecosystem | null = system === "npm" ? "npm" : system === "pypi" ? "pypi" : null; if (!eco || !vk?.name || !vk?.version) continue; const rel = String(node.relation ?? "INDIRECT").toUpperCase(); push(eco, vk.name, vk.version, rel === "SELF" ? "SELF" : rel === "DIRECT" ? "DIRECT" : "INDIRECT"); }
  return out;
}
function normalizeSeverity(vuln: OsvVuln | undefined): Severity { const raw = String(vuln?.database_specific?.severity ?? vuln?.ecosystem_specific?.severity ?? "").toLowerCase(); if (raw.includes("critical")) return "critical"; if (raw.includes("high")) return "high"; if (raw.includes("moderate") || raw.includes("medium")) return "medium"; if (raw.includes("low")) return "low"; return "unknown"; }
function maxDecision(a: Decision, b: Decision): Decision { const rank: Record<Decision, number> = { ALLOW: 0, WARN: 1, BLOCK: 2 }; return rank[b] > rank[a] ? b : a; }

async function inspectPackage(request: DependencyRequest, policy: DependencyPolicy) {
  const ecosystem = normalizedEcosystem(request.ecosystem); const name = validatePackageName(ecosystem, request.name); const requestedVersion = validateVersion(request.version); const system = depsSystem(ecosystem);
  const packageUrl = `https://api.deps.dev/v3/systems/${system}/packages/${encodeURIComponent(name)}`; const packageInfo = await fetchJson<DepsPackageResponse>(packageUrl); const defaultVersion = packageInfo.versions?.find((v) => v.isDefault)?.versionKey?.version; const version = requestedVersion ?? defaultVersion; if (!version) throw new Error("package_default_version_not_found");
  const base = `${packageUrl}/versions/${encodeURIComponent(version)}`; const [versionInfo, dependencyInfo] = await Promise.all([fetchJson<DepsVersionResponse>(base), fetchJson<DepsDependenciesResponse>(`${base}:dependencies`)]);
  const nodes = uniqueVersionNodes(dependencyInfo.nodes ?? [], { ecosystem, name, version }); const scannedNodes = nodes.slice(0, MAX_GRAPH_NODES); const batchBody = { queries: scannedNodes.map((node) => ({ package: { ecosystem: osvEcosystem(node.ecosystem), name: node.name }, version: node.version })) };
  const osv = scannedNodes.length ? await fetchJson<OsvBatchResponse>("https://api.osv.dev/v1/querybatch", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(batchBody) }) : { results: [] };
  const uniqueIds = [...new Set((osv.results ?? []).flatMap((r) => (r.vulns ?? []).map((v) => v.id).filter((id): id is string => Boolean(id))))].slice(0, 16);
  const details = await Promise.all(uniqueIds.map(async (id) => { try { return [id, await fetchJson<OsvVuln>(`https://api.osv.dev/v1/vulns/${encodeURIComponent(id)}`)] as const; } catch { return [id, undefined] as const; } })); const detailMap = new Map(details);
  const vulnerabilities: Array<Record<string, unknown>> = []; let decision: Decision = "ALLOW";
  for (let i = 0; i < scannedNodes.length; i++) { const node = scannedNodes[i]!; const vulns = osv.results?.[i]?.vulns ?? []; for (const hit of vulns) { const detail = hit.id ? detailMap.get(hit.id) : undefined; const severity = normalizeSeverity(detail); vulnerabilities.push({ id: hit.id ?? "unknown", severity, relation: node.relation, package: node.name, version: node.version, ...(detail?.summary ? { summary: detail.summary.slice(0, 500) } : {}) }); if (node.relation === "SELF" || node.relation === "DIRECT") decision = maxDecision(decision, "BLOCK"); else decision = maxDecision(decision, "WARN"); } }
  const directVulnerabilities = vulnerabilities.some((v) => v.relation === "SELF" || v.relation === "DIRECT"); if (policy.block_on_any_direct_vulnerability === false && directVulnerabilities && decision === "BLOCK") decision = "WARN";
  const licenses = Array.isArray(versionInfo.licenses) ? versionInfo.licenses.filter((v) => typeof v === "string") : []; const denied = new Set((policy.denied_licenses ?? []).map((v) => String(v).trim().toLowerCase()).filter(Boolean)); const deniedMatches = licenses.filter((license) => denied.has(license.toLowerCase())); if (deniedMatches.length) decision = "BLOCK"; if (versionInfo.isDeprecated) decision = maxDecision(decision, policy.fail_on_deprecated ? "BLOCK" : "WARN"); if ((dependencyInfo.nodes ?? []).some((node) => (node.errors?.length ?? 0) > 0) || dependencyInfo.error) decision = maxDecision(decision, "WARN");
  return { ecosystem, name, requested_version: requestedVersion ?? null, resolved_version: version, default_version: defaultVersion ?? null, is_default: Boolean(versionInfo.isDefault), deprecated: Boolean(versionInfo.isDeprecated), deprecated_reason: versionInfo.deprecatedReason ?? null, licenses, denied_licenses: deniedMatches, decision, vulnerability_count: vulnerabilities.length, vulnerabilities: vulnerabilities.slice(0, 50), graph: { total_nodes_reported: nodes.length, scanned_nodes: scannedNodes.length, truncated: nodes.length > MAX_GRAPH_NODES, direct_nodes: scannedNodes.filter((n) => n.relation === "DIRECT").length, indirect_nodes: scannedNodes.filter((n) => n.relation === "INDIRECT").length } };
}

export async function dependencyGate(input: DependencyGateInput): Promise<EngineResponse<Record<string, unknown>>> {
  if (!input || !Array.isArray(input.packages) || input.packages.length < 1 || input.packages.length > MAX_PACKAGES) throw new Error("dependency_gate_requires_1_to_5_packages");
  const policy: DependencyPolicy = input.policy && typeof input.policy === "object" ? input.policy : {}; const packages = await Promise.all(input.packages.map((item) => inspectPackage(item, policy))); let decision: Decision = "ALLOW"; for (const item of packages) decision = maxDecision(decision, item.decision as Decision);
  return { data: { decision, install_allowed: decision !== "BLOCK", package_count: packages.length, packages, policy: { direct_vulnerability_action: policy.block_on_any_direct_vulnerability === false ? "WARN" : "BLOCK", deprecated_action: policy.fail_on_deprecated ? "BLOCK" : "WARN", denied_licenses: policy.denied_licenses ?? [] }, provenance: ["deps.dev v3", "OSV.dev v1"] }, meta: meta("dependency-gate", "deps.dev v3 + OSV.dev", 300) };
}

export interface ReleaseGateInput { changed_files: Array<{ path: string; patch: string }>; dependencies?: DependencyRequest[]; dependency_policy?: DependencyPolicy; policy?: { fail_on_warn?: boolean }; }
interface ReleaseFinding { rule: string; severity: "block" | "warn"; path: string; diff_line: number; evidence: string; remediation: string }
function addedLines(patch: string): Array<{ line: string; diffLine: number }> { return patch.split(/\r?\n/).map((line, index) => ({ line, diffLine: index + 1 })).filter(({ line }) => line.startsWith("+") && !line.startsWith("+++")); }
function safeEvidence(line: string): string { return line.replace(/(AKIA)[A-Z0-9]{16}/g, "$1[REDACTED]").replace(/(ghp_|github_pat_|xox[baprs]-)[A-Za-z0-9_\-]{12,}/g, "$1[REDACTED]").replace(/((?:SECRET|TOKEN|PASSWORD|PRIVATE_KEY|API_KEY)[A-Z0-9_]*\s*[:=]\s*["']?)[^"'\s]{8,}/gi, "$1[REDACTED]").slice(0, 240); }
function releaseFindings(files: Array<{ path: string; patch: string }>): ReleaseFinding[] {
  const findings: ReleaseFinding[] = []; const add = (rule: string, severity: "block" | "warn", path: string, diffLine: number, line: string, remediation: string) => findings.push({ rule, severity, path, diff_line: diffLine, evidence: safeEvidence(line), remediation });
  for (const file of files) { const path = file.path.replace(/\\/g, "/"); for (const { line, diffLine } of addedLines(file.patch)) { const body = line.slice(1);
    if (/-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/.test(body)) add("embedded-private-key", "block", path, diffLine, body, "Remove the private key from source and rotate the exposed credential.");
    if (/\bAKIA[A-Z0-9]{16}\b/.test(body) || /\bghp_[A-Za-z0-9]{20,}\b/.test(body) || /\bgithub_pat_[A-Za-z0-9_]{20,}\b/.test(body) || /\bxox[baprs]-[A-Za-z0-9-]{12,}\b/.test(body)) add("known-secret-token-pattern", "block", path, diffLine, body, "Remove and rotate the credential; use a secret manager or protected environment variable.");
    if (/(?:^|\W)(?:[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|PRIVATE_KEY|API_KEY)[A-Z0-9_]*)\s*[:=]\s*["'][^"']{12,}["']/i.test(body)) add("literal-secret-assignment", "block", path, diffLine, body, "Replace the literal with a secret-manager or runtime environment reference and rotate if real.");
    if (/(?:NEXT_PUBLIC_|VITE_|EXPO_PUBLIC_)[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|PRIVATE_KEY|API_KEY)/i.test(body)) add("public-client-secret-variable", "block", path, diffLine, body, "Never expose secrets through client-public environment prefixes.");
    if (/Access-Control-Allow-Origin[^\n]*["']\*["']/i.test(body) || /origin\s*:\s*["']\*["']/i.test(body)) add("cors-wildcard", "warn", path, diffLine, body, "Restrict CORS origins to the required trusted origins.");
    if (/\bDEBUG\s*=\s*(?:true|1)\b/i.test(body) || /\bNODE_ENV\s*=\s*["']?development["']?/i.test(body)) add("production-debug-setting", "warn", path, diffLine, body, "Keep debug/development configuration out of production deployment settings.");
    if (/\b--privileged\b/.test(body)) add("privileged-container", "block", path, diffLine, body, "Remove privileged container execution or document a narrowly-scoped unavoidable exception.");
    if (/^\s*USER\s+root\s*$/i.test(body) && /(?:Dockerfile|\.dockerfile)$/i.test(path)) add("container-runs-as-root", "warn", path, diffLine, body, "Run the final container as a non-root user.");
    if (/["'](?:preinstall|postinstall)["']\s*:/.test(body) && /package\.json$/i.test(path)) add("package-install-script-added", "warn", path, diffLine, body, "Review the install-time script and avoid it when the package can work without install hooks.");
    if (/\b(?:eval\s*\(|new\s+Function\s*\()/.test(body)) add("dynamic-code-execution", "warn", path, diffLine, body, "Avoid dynamic code execution; use explicit parsing or dispatch.");
    if (/\.github\/workflows\//i.test(path) && /uses:\s*[^\s]+@(main|master|v\d+(?:\.\d+)*)\s*$/i.test(body)) add("github-action-not-sha-pinned", "warn", path, diffLine, body, "Pin third-party GitHub Actions to a full commit SHA.");
    if (/(?:migrations?\/|\.sql$)/i.test(path) && /\b(?:DROP\s+(?:TABLE|COLUMN)|TRUNCATE\s+TABLE|ALTER\s+TABLE\b[^;]*\bDROP\b)/i.test(body)) add("destructive-database-migration", "block", path, diffLine, body, "Use a staged expand/migrate/contract migration with an explicit rollback path.");
    if (/(?:migrations?\/|\.sql$)/i.test(path) && /^\s*(?:DELETE\s+FROM|UPDATE\s+\S+\s+SET)\b/i.test(body) && !/\bWHERE\b/i.test(body)) add("unbounded-data-mutation", "warn", path, diffLine, body, "Bound the data mutation with an explicit WHERE clause or a reviewed batch migration.");
  }} return findings;
}

export async function releaseGate(input: ReleaseGateInput): Promise<EngineResponse<Record<string, unknown>>> {
  if (!input || !Array.isArray(input.changed_files) || input.changed_files.length < 1 || input.changed_files.length > MAX_FILES) throw new Error("release_gate_requires_1_to_40_changed_files");
  let totalChars = 0; const files = input.changed_files.map((item) => { const path = String(item?.path ?? "").trim().replace(/\\/g, "/"); const patch = String(item?.patch ?? ""); if (!path || path.length > 240 || path.includes("\0") || /(^|\/)\.\.($|\/)/.test(path)) throw new Error("invalid_changed_file_path"); if (!patch || patch.length > MAX_PATCH_CHARS) throw new Error("invalid_changed_file_patch"); totalChars += patch.length; return { path, patch }; }); if (totalChars > MAX_TOTAL_PATCH_CHARS) throw new Error("release_gate_patch_budget_exceeded");
  const findings = releaseFindings(files); let dependencyResult: Awaited<ReturnType<typeof dependencyGate>> | undefined; if (input.dependencies !== undefined) { const dependencyInput: DependencyGateInput = input.dependency_policy === undefined ? { packages: input.dependencies } : { packages: input.dependencies, policy: input.dependency_policy }; dependencyResult = await dependencyGate(dependencyInput); }
  const hasBlock = findings.some((f) => f.severity === "block") || dependencyResult?.data.decision === "BLOCK"; const hasWarn = findings.some((f) => f.severity === "warn") || dependencyResult?.data.decision === "WARN"; const failOnWarn = Boolean(input.policy?.fail_on_warn); const grade: "PASS" | "WARN" | "BLOCK" = hasBlock || (failOnWarn && hasWarn) ? "BLOCK" : hasWarn ? "WARN" : "PASS";
  return { data: { ship: grade !== "BLOCK", grade, changed_file_count: files.length, finding_count: findings.length, findings, ...(dependencyResult ? { dependency_gate: dependencyResult.data } : {}), checks: ["secret-patterns", "public-env-exposure", "deployment-config", "container-privilege", "github-actions-pinning", "destructive-migrations", "dynamic-code-execution", ...(dependencyResult ? ["dependency-risk"] : [])], note: "Static preflight over supplied added diff lines. PASS is not a security guarantee and does not replace project tests or specialist scanners." }, meta: meta("release-gate", dependencyResult ? "local deterministic diff checks + deps.dev v3 + OSV.dev" : "local deterministic diff checks", 0) };
}