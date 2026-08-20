# Banking / EUR Off-ramp Policy — x402 Canary

## Launch policy
- EUR is the treasury target; USDC is transport only.
- `OFFRAMP_VERIFIED=false` remains authoritative until a compliant business off-ramp is contractually and operationally proven.
- While unresolved, `UNOFFRAMPED_USDC_CAP=250` applies; at the cap paid routes fail closed before x402 negotiation so no new customer is charged.
- No automated bridge, conversion or sweep is part of the public Worker.

## Provider policy
No bank/exchange is considered approved merely because an account exists. Business-use terms, crypto-source acceptance, EI compatibility, minimums/fees and one real EUR withdrawal must be verified before setting `OFFRAMP_VERIFIED=true`.

## Final principle
Revenue validation starts under the capped canary; treasury automation follows only after the off-ramp is proven.
