# Agent Context + Preflight Unit Economics — candidate 0.5.0

## Current commercial prices
- NPM Symbol Context: `$0.015` per call, one package/version and up to eight requested symbols.
- NPM API Diff: `$0.025` per call, one exact version-to-version comparison.
- Browser Context: `$0.03` per call, one bounded public HTTPS page render.
- Dependency Gate: `$0.015` per call, up to five dependency candidates.
- Release Gate: `$0.04` per call.

## Buyer-loop density
Ignoring wallet/facilitator/network overhead, a `$5` buyer budget buys approximately 333 NPM Symbol Context calls, 200 NPM API Diffs, 166 Browser Context calls, 333 Dependency Gates, or 125 Release Gates. The `$5` is buyer usage budget, not seller inventory.

## Variable costs
- NPM Symbol Context / API Diff: no paid data upstream; bounded public npm Registry API/tarball traffic plus Worker compute/cache.
- Dependency Gate: no paid data upstream; bounded public deps.dev/OSV calls.
- Release Gate: deterministic bounded compute; optional dependency checks reuse the internal engine without a second x402 charge.
- Browser Context: Cloudflare Browser Run Quick Actions. Current Workers Paid allowance is 10 browser-hours/month, then `$0.09/browser-hour`; Workers Free includes 10 minutes/day but is rate-limited to one Quick Action every 10 seconds. `X-Browser-Ms-Used` is returned and surfaced so real marginal cost can be measured.
- At `$0.09/hour`, 15 seconds of chargeable browser time costs about `$0.000375` before Worker/D1/payment overhead versus a `$0.03` selling price. This is a unit-cost ceiling illustration, not a usage forecast.
- Facilitator/network/Worker/D1 costs must be measured from actual usage rather than guessed.

## Revenue arithmetic
The new tools are not assigned a forecast mix before independent demand exists. Illustrative gross call counts are:
- at `$0.015`: 46,667 calls ≈ `$700`, 100,000 ≈ `$1,500`;
- at `$0.025`: 28,000 calls ≈ `$700`, 60,000 ≈ `$1,500`;
- at `$0.03`: 23,334 calls ≈ `$700`, 50,000 ≈ `$1,500`;
- at `$0.04`: 17,500 calls ≈ `$700`, 37,500 ≈ `$1,500`.

Scale requires independent payer and repeat-use evidence. Existing `$250` unofframped cap and `$0` seller-funded self-testing remain authoritative.
