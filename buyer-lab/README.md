# Coding-Agent Need Discovery + Buyer Lab

The methodology is **need first, product second**.

## Stage 1 — Need Discovery (primary)

GPT, Claude and Gemini receive realistic engineering tasks **without seeing any x402 product or proposed tool**. They are told which local capabilities are free and must identify an external capability only when local evidence is genuinely insufficient.

30 scenarios × 3 model families × 2 repeats = 180 observations.

Providers:
- GPT-5.6 Sol
- Claude Opus 4.6
- Gemini 3.1 Pro Preview

Each need record captures:
- exact missing capability
- workflow trigger
- missing evidence/action
- likely frequency
- maximum acceptable per-call price
- latency tolerance
- freshness requirement
- why native/local reasoning is insufficient

Run:

```bash
npm install
npm run run:needs
```

Results are aggregated by `summarize-needs.mjs`. A verbal model preference is **hypothesis evidence only**. A product candidate becomes strong only when need discovery agrees with revealed behavior such as MCP adoption or real paid transactions.

## Stage 2 — Buyer selection

`promptfooconfig.yaml` remains as a downstream behavioral test. Here products are finally exposed with real prices and `tool_choice:auto`, alongside free local alternatives. The model is never forced to buy.

Run:

```bash
npm run run
```

Metrics include voluntary paid-tool selection, free substitution, no-tool rate, false-positive purchases and missed calls.

## Stage 3 — Agentic check

`agentic.yaml` runs closer to actual coding-agent behavior:
- Codex SDK can reuse an existing Codex/ChatGPT CLI login when API keys are unset.
- Claude providers can reuse an existing Claude Code credential with `apiKeyRequired:false` where supported.

```bash
npm run eval:agentic
npm run report:agentic
```

## Authentication

Credentials are deliberately external to Git. Direct provider runs may use:
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY` or an existing Claude Code OAuth session
- `GOOGLE_API_KEY`

Never commit keys.

## Product rule

Do not start from an API idea. Prefer needs that:
1. recur across more than one model family;
2. require external/current state rather than something the model can derive locally;
3. have a narrow machine-readable contract;
4. can be served cheaply and automatically;
5. show independent revealed demand (MCP adoption, repeated API usage, or real transactions).

Do not rescue a weak product with wording tricks. If models can reliably obtain the same evidence locally for free, the paid product is structurally weak.
