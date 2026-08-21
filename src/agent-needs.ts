import { normalizeUrl } from "./util.ts";
import type { EngineResponse, Env } from "./types.ts";

const FETCH_TIMEOUT_MS = 8000;
const MAX_TARBALL_COMPRESSED_BYTES = 4 * 1024 * 1024;
const MAX_TARBALL_UNCOMPRESSED_BYTES = 12 * 1024 * 1024;
const MAX_DECLARATION_BYTES = 3 * 1024 * 1024;
const MAX_MARKDOWN_CHARS = 60_000;
const MAX_TREE_CHARS = 60_000;

function meta(engine: string, source: string, sourceUrl: string | undefined, ttl: number) {
  return { engine, source, ...(sourceUrl ? { source_url: sourceUrl } : {}), fetched_at: new Date().toISOString(), cache_ttl_s: ttl };
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw new Error("upstream_timeout");
    throw new Error("upstream_unavailable");
  } finally {
    clearTimeout(timer);
  }
}

async function cachedJson(url: string, ttlSeconds: number, headers?: HeadersInit): Promise<unknown> {
  const cache = await caches.open("x402-canary-agent-needs-v1");
  const request = new Request(url, { method: "GET", ...(headers !== undefined ? { headers } : {}) });
  const hit = await cache.match(request);
  if (hit) return hit.json();
  const response = await fetchWithTimeout(url, headers !== undefined ? { headers } : {});
  if (!response.ok) throw new Error(`upstream_http_${response.status}`);
  const text = await response.text();
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error("upstream_invalid_json"); }
  await cache.put(request, new Response(text, { headers: { "content-type": "application/json", "cache-control": `public, max-age=${ttlSeconds}` } }));
  return parsed;
}

export function normalizeNpmPackageName(input: string): string {
  const name = input.trim();
  if (!name || name.length > 214 || /\s/.test(name)) throw new Error("invalid_npm_package");
  if (name.startsWith("@")) {
    if (!/^@[a-z0-9._~-]+\/[a-z0-9._~-]+$/i.test(name)) throw new Error("invalid_npm_package");
  } else if (!/^[a-z0-9._~-]+$/i.test(name)) throw new Error("invalid_npm_package");
  return name;
}

function normalizeVersion(input: string | undefined): string | undefined {
  if (input === undefined || input.trim() === "") return undefined;
  const version = input.trim();
  if (version.length > 100 || !/^[0-9A-Za-z.+_-]+$/.test(version)) throw new Error("invalid_npm_version");
  return version;
}

function npmVersionUrl(name: string, version?: string): string {
  return `https://registry.npmjs.org/${encodeURIComponent(name)}/${encodeURIComponent(version ?? "latest")}`;
}

type NpmMeta = {
  name?: string;
  version?: string;
  description?: string;
  deprecated?: string;
  engines?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  exports?: unknown;
  types?: string;
  typings?: string;
  readme?: string;
  repository?: string | { type?: string; url?: string; directory?: string };
  dist?: { tarball?: string; integrity?: string; shasum?: string; unpackedSize?: number };
};

async function npmMetadata(name: string, version?: string): Promise<NpmMeta> {
  const url = npmVersionUrl(name, version);
  const json = await cachedJson(url, 300, { accept: "application/json" });
  if (!json || typeof json !== "object" || Array.isArray(json)) throw new Error("npm_metadata_invalid");
  const metadata = json as NpmMeta;
  if (typeof metadata.version !== "string" || typeof metadata.name !== "string") throw new Error("npm_package_not_found");
  return metadata;
}

function safeRecord(value: unknown, maxEntries = 80): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).slice(0, maxEntries));
}

function repositoryUrl(repository: NpmMeta["repository"]): string | undefined {
  const raw = typeof repository === "string" ? repository : repository?.url;
  if (!raw) return undefined;
  return raw.replace(/^git\+/, "").replace(/\.git$/, "");
}

function parseTarOctal(bytes: Uint8Array, start: number, length: number): number {
  const raw = new TextDecoder().decode(bytes.slice(start, start + length)).replace(/\0.*$/, "").trim();
  if (!raw) return 0;
  const n = Number.parseInt(raw, 8);
  return Number.isFinite(n) ? n : 0;
}

async function readLimitedStream(stream: ReadableStream<Uint8Array>, maxBytes: number): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel("size_limit");
      throw new Error("npm_tarball_too_large");
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { out.set(chunk, offset); offset += chunk.byteLength; }
  return out;
}

async function fetchTarball(metadata: NpmMeta): Promise<Uint8Array> {
  const tarball = metadata.dist?.tarball;
  if (!tarball) throw new Error("npm_tarball_missing");
  let url: URL;
  try { url = new URL(tarball); } catch { throw new Error("npm_tarball_invalid"); }
  if (url.protocol !== "https:" || url.hostname !== "registry.npmjs.org") throw new Error("npm_tarball_host_rejected");
  const response = await fetchWithTimeout(url.toString(), { headers: { accept: "application/octet-stream" } }, 12_000);
  if (!response.ok || !response.body) throw new Error(`upstream_http_${response.status}`);
  const compressedLength = Number(response.headers.get("content-length") ?? "0");
  if (compressedLength > MAX_TARBALL_COMPRESSED_BYTES) throw new Error("npm_tarball_too_large");
  return readLimitedStream(response.body.pipeThrough(new DecompressionStream("gzip")), MAX_TARBALL_UNCOMPRESSED_BYTES);
}

export function extractTarTextFiles(tar: Uint8Array): Map<string, string> {
  const files = new Map<string, string>();
  const decoder = new TextDecoder();
  let offset = 0;
  let declarationBytes = 0;
  while (offset + 512 <= tar.byteLength) {
    const header = tar.slice(offset, offset + 512);
    if (header.every((b) => b === 0)) break;
    const name = decoder.decode(header.slice(0, 100)).replace(/\0.*$/, "");
    const prefix = decoder.decode(header.slice(345, 500)).replace(/\0.*$/, "");
    const fullName = prefix ? `${prefix}/${name}` : name;
    const size = parseTarOctal(header, 124, 12);
    const typeFlag = String.fromCharCode(header[156] ?? 0);
    const dataStart = offset + 512;
    const dataEnd = dataStart + size;
    if (dataEnd > tar.byteLength) break;
    if ((typeFlag === "0" || typeFlag === "\0") && (fullName.endsWith(".d.ts") || /(^|\/)readme(?:\.md)?$/i.test(fullName))) {
      if (fullName.endsWith(".d.ts")) declarationBytes += size;
      if (declarationBytes <= MAX_DECLARATION_BYTES && files.size < 300) files.set(fullName, decoder.decode(tar.slice(dataStart, dataEnd)));
    }
    offset = dataStart + Math.ceil(size / 512) * 512;
  }
  return files;
}

function escapeRegex(value: string): string { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

export function declarationSnippets(files: Map<string, string>, symbols: string[]): Array<{ symbol: string; file: string; snippet: string }> {
  const hits: Array<{ symbol: string; file: string; snippet: string }> = [];
  for (const symbol of symbols) {
    if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(symbol)) throw new Error("invalid_symbol_name");
    const declaration = new RegExp(`\\b(?:export\\s+)?(?:declare\\s+)?(?:abstract\\s+)?(?:class|interface|type|function|const|let|var|enum|namespace)\\s+${escapeRegex(symbol)}\\b`);
    for (const [file, text] of files) {
      if (!file.endsWith(".d.ts")) continue;
      const match = declaration.exec(text) ?? new RegExp(`\\b${escapeRegex(symbol)}\\b`).exec(text);
      if (!match) continue;
      const start = Math.max(0, text.lastIndexOf("\n", Math.max(0, match.index - 400)) + 1);
      const endBoundary = Math.min(text.length, match.index + match[0].length + 900);
      const endLine = text.indexOf("\n", endBoundary);
      const end = endLine === -1 ? endBoundary : endLine;
      hits.push({ symbol, file, snippet: text.slice(start, end).trim().slice(0, 1400) });
      if (hits.filter((h) => h.symbol === symbol).length >= 2 || hits.length >= 12) break;
    }
  }
  return hits;
}

export function exportedDeclarationMap(files: Map<string, string>): Map<string, string> {
  const out = new Map<string, string>();
  const declaration = /^\s*export\s+(?:declare\s+)?(?:default\s+)?(?:abstract\s+)?(?:class|interface|type|function|const|let|var|enum|namespace)\s+([A-Za-z_$][A-Za-z0-9_$]*)[^\n]*/gm;
  const exportList = /^\s*export\s*\{([^}]+)\}[^\n]*/gm;
  for (const [file, text] of files) {
    if (!file.endsWith(".d.ts")) continue;
    let match: RegExpExecArray | null;
    while ((match = declaration.exec(text)) !== null) {
      const name = match[1]!;
      if (!out.has(name)) out.set(name, match[0].trim().replace(/\s+/g, " ").slice(0, 500));
      if (out.size >= 5000) return out;
    }
    while ((match = exportList.exec(text)) !== null) {
      for (const part of match[1]!.split(",")) {
        const cleaned = part.trim().replace(/^type\s+/, "");
        const alias = /\s+as\s+/.test(cleaned) ? cleaned.split(/\s+as\s+/).pop()! : cleaned;
        const name = alias.trim();
        if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) && !out.has(name)) out.set(name, match[0].trim().replace(/\s+/g, " ").slice(0, 500));
      }
      if (out.size >= 5000) return out;
    }
  }
  return out;
}

export interface NpmSymbolContextInput { package: string; version?: string; symbols?: string[]; }
export async function npmSymbolContext(input: NpmSymbolContextInput): Promise<EngineResponse<Record<string, unknown>>> {
  const name = normalizeNpmPackageName(input?.package ?? "");
  const requestedVersion = normalizeVersion(input?.version);
  const symbols = input?.symbols === undefined ? [] : input.symbols.map((s) => String(s).trim());
  if (symbols.length > 8) throw new Error("too_many_symbols");
  const resolved = await npmMetadata(name, requestedVersion);
  const latest = requestedVersion ? await npmMetadata(name) : resolved;
  let files = new Map<string, string>();
  if (symbols.length > 0) files = extractTarTextFiles(await fetchTarball(resolved));
  const readme = typeof resolved.readme === "string" ? resolved.readme : [...files.entries()].find(([path]) => /(^|\/)readme(?:\.md)?$/i.test(path))?.[1];
  const snippets = symbols.length > 0 ? declarationSnippets(files, symbols) : [];
  const resolvedVersion = resolved.version!;
  return {
    data: {
      package: resolved.name,
      resolved_version: resolvedVersion,
      latest_version: latest.version,
      is_latest: latest.version === resolvedVersion,
      description: resolved.description ?? null,
      deprecated: resolved.deprecated ?? null,
      engines: safeRecord(resolved.engines),
      peer_dependencies: safeRecord(resolved.peerDependencies),
      direct_dependency_count: Object.keys(resolved.dependencies ?? {}).length,
      optional_dependency_count: Object.keys(resolved.optionalDependencies ?? {}).length,
      types_entry: resolved.types ?? resolved.typings ?? null,
      exports: safeRecord(resolved.exports, 120) ?? resolved.exports ?? null,
      repository: repositoryUrl(resolved.repository) ?? null,
      integrity: resolved.dist?.integrity ?? resolved.dist?.shasum ?? null,
      unpacked_size: resolved.dist?.unpackedSize ?? null,
      requested_symbols: symbols,
      symbol_hits: snippets,
      missing_symbols: symbols.filter((symbol) => !snippets.some((hit) => hit.symbol === symbol)),
      readme_excerpt: readme ? readme.slice(0, 6000) : null,
    },
    meta: meta("npm-symbol-context", "npm registry published package metadata and tarball declarations", npmVersionUrl(name, resolvedVersion), 300),
  };
}

export interface NpmApiDiffInput { package: string; from_version: string; to_version: string; }
export async function npmApiDiff(input: NpmApiDiffInput): Promise<EngineResponse<Record<string, unknown>>> {
  const name = normalizeNpmPackageName(input?.package ?? "");
  const fromVersion = normalizeVersion(input?.from_version);
  const toVersion = normalizeVersion(input?.to_version);
  if (!fromVersion || !toVersion || fromVersion === toVersion) throw new Error("api_diff_requires_two_versions");
  const [fromMeta, toMeta] = await Promise.all([npmMetadata(name, fromVersion), npmMetadata(name, toVersion)]);
  const [fromFiles, toFiles] = await Promise.all([fetchTarball(fromMeta).then(extractTarTextFiles), fetchTarball(toMeta).then(extractTarTextFiles)]);
  const fromMap = exportedDeclarationMap(fromFiles);
  const toMap = exportedDeclarationMap(toFiles);
  const added = [...toMap.keys()].filter((symbol) => !fromMap.has(symbol)).sort();
  const removed = [...fromMap.keys()].filter((symbol) => !toMap.has(symbol)).sort();
  const changed = [...fromMap.keys()].filter((symbol) => toMap.has(symbol) && fromMap.get(symbol) !== toMap.get(symbol)).sort();
  const enginesChanged = JSON.stringify(fromMeta.engines ?? {}) !== JSON.stringify(toMeta.engines ?? {});
  const peersChanged = JSON.stringify(fromMeta.peerDependencies ?? {}) !== JSON.stringify(toMeta.peerDependencies ?? {});
  const risk = removed.length > 0 || enginesChanged || peersChanged ? "HIGH" : changed.length > 0 ? "MEDIUM" : "LOW";
  return {
    data: {
      package: name,
      from_version: fromMeta.version,
      to_version: toMeta.version,
      risk,
      exported_symbol_counts: { from: fromMap.size, to: toMap.size },
      added_symbols: added.slice(0, 200),
      removed_symbols: removed.slice(0, 200),
      changed_symbols: changed.slice(0, 200),
      truncated: added.length > 200 || removed.length > 200 || changed.length > 200,
      engines: { from: safeRecord(fromMeta.engines), to: safeRecord(toMeta.engines), changed: enginesChanged },
      peer_dependencies: { from: safeRecord(fromMeta.peerDependencies), to: safeRecord(toMeta.peerDependencies), changed: peersChanged },
      deprecated: { from: fromMeta.deprecated ?? null, to: toMeta.deprecated ?? null },
      repository: repositoryUrl(toMeta.repository) ?? repositoryUrl(fromMeta.repository) ?? null,
      note: "Declaration-level diff over published .d.ts files. Dynamic runtime behavior and undocumented APIs are outside scope.",
    },
    meta: meta("npm-api-diff", "npm registry published package tarballs", `https://registry.npmjs.org/${encodeURIComponent(name)}`, 300),
  };
}

function trimTree(value: unknown): { value?: unknown; excerpt?: string; truncated: boolean } {
  const text = JSON.stringify(value ?? null);
  if (text.length <= MAX_TREE_CHARS) return { value: value ?? null, truncated: false };
  return { excerpt: text.slice(0, MAX_TREE_CHARS), truncated: true };
}

export interface BrowserContextInput { url: string; wait_until?: "domcontentloaded" | "networkidle0" | "networkidle2"; }
export async function browserContext(env: Env, input: BrowserContextInput): Promise<EngineResponse<Record<string, unknown>>> {
  if (!env.BROWSER) throw new Error("browser_binding_unavailable");
  const url = normalizeUrl(input?.url ?? "");
  const waitUntil = input?.wait_until ?? "domcontentloaded";
  const response = await env.BROWSER.quickAction("snapshot", {
    url,
    formats: ["markdown", "accessibilityTree"],
    gotoOptions: { waitUntil, timeout: 15_000 },
  });
  const browserMs = Number(response.headers.get("x-browser-ms-used") ?? "0");
  if (!response.ok) throw new Error(`browser_run_http_${response.status}`);
  let json: unknown;
  try { json = await response.json(); } catch { throw new Error("browser_run_invalid_json"); }
  if (!json || typeof json !== "object" || Array.isArray(json)) throw new Error("browser_run_invalid_json");
  const root = json as Record<string, unknown>;
  const result = root.result && typeof root.result === "object" && !Array.isArray(root.result) ? root.result as Record<string, unknown> : {};
  const pageMeta = root.meta && typeof root.meta === "object" && !Array.isArray(root.meta) ? root.meta as Record<string, unknown> : {};
  const markdownRaw = typeof result.markdown === "string" ? result.markdown : "";
  const tree = trimTree(result.accessibilityTree);
  return {
    data: {
      url,
      status: typeof pageMeta.status === "number" ? pageMeta.status : null,
      title: typeof pageMeta.title === "string" ? pageMeta.title : null,
      markdown: markdownRaw.slice(0, MAX_MARKDOWN_CHARS),
      markdown_truncated: markdownRaw.length > MAX_MARKDOWN_CHARS,
      ...(tree.value !== undefined ? { accessibility_tree: tree.value } : {}),
      ...(tree.excerpt !== undefined ? { accessibility_tree_excerpt: tree.excerpt } : {}),
      accessibility_tree_truncated: tree.truncated,
      browser_ms_used: Number.isFinite(browserMs) ? browserMs : 0,
      wait_until: waitUntil,
    },
    meta: meta("browser-context", "Cloudflare Browser Run managed headless Chrome", url, 30),
  };
}
