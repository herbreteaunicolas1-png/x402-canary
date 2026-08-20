# Wallet & Treasury Policy — x402 Canary 0.5.0

## Principle
USDC on Base is a machine-payment transport rail; treasury target is EUR.

## Merchant receiving wallet
- Canonical public payee: `0xa42a56C5Ad4E60CE4e45Bf8844656A496F5D9aB8`.
- Merchant private key remains outside GitHub/ChatGPT/Cloudflare and is never required by the public Worker.
- Worker receives only public PAY_TO, facilitator URL, D1 binding and non-secret operating variables.
- Maximum unconverted exposure remains USD 250 while `OFFRAMP_VERIFIED=false`.

## Treasury sweep
No automated sweep is enabled until a compliant business EUR off-ramp and one small end-to-end withdrawal are verified. Treasury movements must not be counted a second time as turnover.

## Accounting journal
Each settled API payment is recorded in D1 with route, engine, family, USD price, payer, transaction hash, channel attribution and best-effort USD/EUR valuation.
