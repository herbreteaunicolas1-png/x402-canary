import { paymentMiddleware, x402ResourceServer } from "@x402/hono";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { registerExactEvmScheme } from "@x402/evm/exact/server";
import { bazaarResourceServerExtension, declareDiscoveryExtension } from "@x402/extensions/bazaar";
import type { MiddlewareHandler } from "hono";
import { ROUTES } from "./catalog.ts";
import type { Env, Variables } from "./types.ts";
import { facilitatorUrl } from "./payment-config.ts";
import { discoveryInputExample } from "./discovery.ts";
import { formatX402Price } from "./pricing.ts";

let cachedKey = "";
let cachedMiddleware: MiddlewareHandler<{ Bindings: Env; Variables: Variables }> | null = null;

export { assertProductionPaymentConfig } from "./payment-config.ts";
import { assertProductionPaymentConfig } from "./payment-config.ts";

export function getPaymentMiddleware(env: Env): MiddlewareHandler<{ Bindings: Env; Variables: Variables }> {
  assertProductionPaymentConfig(env);
  const url = facilitatorUrl(env);
  const key = [env.ENVIRONMENT, env.NETWORK, env.PAY_TO, url].join("|");
  if (cachedMiddleware && cachedKey === key) return cachedMiddleware;
  const facilitatorClient = new HTTPFacilitatorClient({ url });
  const server = new x402ResourceServer(facilitatorClient);
  registerExactEvmScheme(server, { networks: [env.NETWORK] });
  server.registerExtension(bazaarResourceServerExtension);
  const routeConfig: Record<string, unknown> = {};
  for (const route of ROUTES) {
    routeConfig[`${route.method} ${route.path}`] = {
      accepts: [{ scheme: "exact", price: formatX402Price(route.priceUsd), network: env.NETWORK, payTo: env.PAY_TO }],
      description: route.description,
      mimeType: "application/json",
      extensions: { ...declareDiscoveryExtension({ input: discoveryInputExample(route.schema), inputSchema: route.schema, bodyType: "json", output: { example: { data: route.outputExample, meta: { engine: route.engine } } } }) },
    };
  }
  cachedMiddleware = paymentMiddleware(routeConfig as never, server) as MiddlewareHandler<{ Bindings: Env; Variables: Variables }>;
  cachedKey = key;
  return cachedMiddleware;
}
