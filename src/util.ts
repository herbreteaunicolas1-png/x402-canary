const LOCAL_HOSTNAMES = new Set(["localhost", "localhost.localdomain", "ip6-localhost", "ip6-loopback"]);

export function cleanDomain(input: string): string {
  const raw = input.trim().toLowerCase().replace(/\.$/, "");
  if (!raw || raw.length > 253) throw new Error("invalid_domain");
  if (LOCAL_HOSTNAMES.has(raw)) throw new Error("private_or_local_domain");
  if (raw.includes("://") || raw.includes("/") || raw.includes("@")) throw new Error("invalid_domain");
  if (!/^[a-z0-9.-]+$/i.test(raw)) throw new Error("invalid_domain");
  const labels = raw.split(".");
  if (labels.length < 2) throw new Error("invalid_domain");
  for (const label of labels) {
    if (!label || label.length > 63 || label.startsWith("-") || label.endsWith("-")) throw new Error("invalid_domain");
  }
  if (isPrivateIpLiteral(raw)) throw new Error("private_or_local_domain");
  return raw;
}

export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 2048) throw new Error("invalid_url");
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try { url = new URL(candidate); } catch { throw new Error("invalid_url"); }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("unsupported_scheme");
  const host = url.hostname.toLowerCase();
  if (LOCAL_HOSTNAMES.has(host) || isPrivateIpLiteral(host)) throw new Error("private_or_local_url");
  url.hash = ""; url.username = ""; url.password = ""; url.hostname = host;
  if ((url.protocol === "https:" && url.port === "443") || (url.protocol === "http:" && url.port === "80")) url.port = "";
  return url.toString();
}

export function normalizeEmail(input: string): { email: string; local: string; domain: string } {
  const email = input.trim().toLowerCase();
  if (email.length > 254) throw new Error("invalid_email");
  const match = /^([^\s@]{1,64})@([^\s@]+)$/.exec(email);
  if (!match) throw new Error("invalid_email");
  const local = match[1]!; const domain = cleanDomain(match[2]!);
  return { email: `${local}@${domain}`, local, domain };
}

export function isPrivateIpLiteral(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (h === "::1" || h === "::" || h.startsWith("fc") || h.startsWith("fd") || /^fe[89ab]/.test(h)) return true;
  if (h.startsWith("::ffff:")) return isPrivateIpLiteral(h.slice(7));
  const parts = h.split(".");
  if (parts.length !== 4 || parts.some((p) => !/^\d{1,3}$/.test(p))) return false;
  const nums = parts.map(Number);
  if (nums.some((n) => n < 0 || n > 255)) return false;
  const [a, b] = nums as [number, number, number, number];
  return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 0) || (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19)) || a >= 224;
}

export function parseJsonBodyText(text: string, maxBytes = 64 * 1024): unknown {
  if (new TextEncoder().encode(text).byteLength > maxBytes) throw new Error("payload_too_large");
  try { return JSON.parse(text); } catch { throw new Error("invalid_json"); }
}

export function roundMoney(value: number, digits = 8): number {
  if (!Number.isFinite(value)) throw new Error("non_finite_number");
  return Number(value.toFixed(digits));
}

export function sha256Hex(input: string): Promise<string> {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(input)).then((buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join(""));
}

export function decodeBase64Json<T>(value: string): T | null {
  try {
    if (value.trim().startsWith("{")) return JSON.parse(value) as T;
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as T;
  } catch { return null; }
}
