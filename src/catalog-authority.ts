import { ROUTES as BASE_ROUTES } from "./catalog.ts";
import type { RouteSpec as BaseRouteSpec } from "./catalog.ts";

export type RouteFamily = BaseRouteSpec["family"] | "agent-context";
export interface RouteSpec extends Omit<BaseRouteSpec, "family"> { family: RouteFamily; }

const NEED_ROUTES: RouteSpec[] = [
  {
    id: "npm-symbol-context",
    method: "POST",
    path: "/v1/agent/npm-symbol-context",
    engine: "npm-symbol-context",
    priceUsd: 0.015,
    description: "npm docs TypeScript API package symbols. Version-specific published npm metadata and exact .d.ts symbol declarations for coding agents when library documentation, package API, function signature, class, type, import or SDK usage may be stale or missing locally.",
    schema: {
      type: "object",
      properties: {
        package: { type: "string", maxLength: 214, example: "hono" },
        version: { type: "string", maxLength: 100, example: "4.13.2" },
        symbols: { type: "array", maxItems: 8, items: { type: "string" }, example: ["Hono"] }
      },
      required: ["package"],
      additionalProperties: false
    },
    outputExample: { package: "hono", resolved_version: "4.13.2", latest_version: "4.13.2", requested_symbols: ["Hono"], symbol_hits: [{ symbol: "Hono", file: "package/dist/types/hono.d.ts", snippet: "export declare class Hono..." }] },
    priority: "launch",
    family: "agent-context"
  },
  {
    id: "npm-api-diff",
    method: "POST",
    path: "/v1/agent/npm-api-diff",
    engine: "npm-api-diff",
    priceUsd: 0.025,
    description: "npm package upgrade breaking changes migration API diff. Compare two published npm versions and return added, removed or changed TypeScript API symbols, Node engine changes and peer-dependency changes for dependency update, migration and compatibility decisions.",
    schema: {
      type: "object",
      properties: {
        package: { type: "string", maxLength: 214, example: "hono" },
        from_version: { type: "string", maxLength: 100, example: "4.12.0" },
        to_version: { type: "string", maxLength: 100, example: "4.13.2" }
      },
      required: ["package", "from_version", "to_version"],
      additionalProperties: false
    },
    outputExample: { package: "hono", from_version: "4.12.0", to_version: "4.13.2", risk: "MEDIUM", added_symbols: [], removed_symbols: [], changed_symbols: [] },
    priority: "launch",
    family: "agent-context"
  },
  {
    id: "browser-context",
    method: "POST",
    path: "/v1/agent/browser-context",
    engine: "browser-context",
    priceUsd: 0.03,
    description: "browser snapshot rendered web page JavaScript accessibility. Open a public HTTPS website in managed headless Chrome after JavaScript execution and return current page Markdown, accessibility tree, title and status for frontend debugging, docs pages, dynamic websites and live web UI inspection.",
    schema: {
      type: "object",
      properties: {
        url: { type: "string", format: "uri", example: "https://example.com" },
        wait_until: { type: "string", enum: ["domcontentloaded", "networkidle0", "networkidle2"], default: "domcontentloaded" }
      },
      required: ["url"],
      additionalProperties: false
    },
    outputExample: { url: "https://example.com/", status: 200, title: "Example Domain", markdown: "# Example Domain", accessibility_tree_truncated: false },
    priority: "launch",
    family: "agent-context"
  }
];

export const ROUTES: RouteSpec[] = [...BASE_ROUTES, ...NEED_ROUTES];
if (new Set(ROUTES.map((route) => `${route.method} ${route.path}`)).size !== ROUTES.length) throw new Error("duplicate_route_authority");
if (new Set(ROUTES.map((route) => route.id)).size !== ROUTES.length) throw new Error("duplicate_route_id");
export const ROUTE_BY_KEY = new Map(ROUTES.map((route) => [`${route.method} ${route.path}`, route]));
export const ROUTE_BY_PATH = new Map(ROUTES.map((route) => [route.path, route]));
