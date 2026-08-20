import test from "node:test";
import assert from "node:assert/strict";
import { exposureAllowed, unofframpedCapUsd } from "../src/treasury.ts";
import type { Env } from "../src/types.ts";

function env(overrides: Partial<Env> = {}): Env {
  return {
    ENVIRONMENT: "production",
    NETWORK: "eip155:8453",
    PAY_TO: "0x1111111111111111111111111111111111111111",
    PUBLIC_BASE_URL: "https://example.com",
    OFFRAMP_VERIFIED: "false",
    UNOFFRAMPED_USDC_CAP: "250",
    ...overrides,
  };
}

test("unverified offramp caps production exposure", () => {
  assert.equal(unofframpedCapUsd(env()), 250);
  assert.equal(exposureAllowed(env(), 0), true);
  assert.equal(exposureAllowed(env(), 249.99), true);
  assert.equal(exposureAllowed(env(), 250), false);
  assert.equal(exposureAllowed(env({ OFFRAMP_VERIFIED: "true" }), 9999), true);
});

test("testnet never blocks on treasury cap", () => {
  assert.equal(exposureAllowed(env({ ENVIRONMENT: "testnet", NETWORK: "eip155:84532" }), 10000), true);
});
