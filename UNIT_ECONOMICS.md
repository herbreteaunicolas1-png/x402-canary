# Agent Preflight Unit Economics — candidate 0.5.0

## Launch prices
- Dependency Gate: `$0.015` per call, up to five dependency candidates.
- Release Gate: `$0.04` per call.
- Combined nominal dependency + release workflow: `$0.055`.

## Buyer-loop density
Ignoring wallet/facilitator/network overhead, a `$5` buyer budget buys approximately 333 Dependency Gates, 125 Release Gates, or 90 combined cycles. The `$5` is buyer usage budget, not seller inventory.

## Variable costs
- Paid data upstream: `$0` for both launch products.
- Dependency Gate uses bounded public deps.dev/OSV calls.
- Release Gate is deterministic bounded compute; optional dependency checks reuse the internal engine without a second x402 charge.
- Cloudflare/D1/facilitator/network costs must be measured from real usage rather than guessed.

## Revenue arithmetic
At an illustrative 40% Dependency / 60% Release mix, average gross price is `$0.03` per paid call: about 23,334 calls/month for $700 gross, 50,000 for $1,500, and 83,334 for $2,500. These are arithmetic targets, not forecasts.

Scale requires independent payer and repeat-use evidence. Existing `$250` unofframped cap and `$0` seller-funded self-testing remain authoritative.
