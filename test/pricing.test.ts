import test from "node:test";
import assert from "node:assert/strict";
import { formatUsdAmount, formatX402Price } from "../src/pricing.ts";

test("x402 prices preserve sub-cent precision without changing legacy prices", () => {
  assert.equal(formatUsdAmount(0.01), "0.01");
  assert.equal(formatUsdAmount(0.015), "0.015");
  assert.equal(formatUsdAmount(0.025), "0.025");
  assert.equal(formatUsdAmount(0.03), "0.03");
  assert.equal(formatUsdAmount(0.04), "0.04");
  assert.equal(formatX402Price(0.015), "$0.015");
  assert.equal(formatX402Price(0.025), "$0.025");
  assert.equal(formatX402Price(0.03), "$0.03");
  assert.throws(() => formatUsdAmount(0), /invalid_usd_price/);
});
