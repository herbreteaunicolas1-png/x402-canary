# x402 Buyer Lab

Purpose: measure whether GPT, Claude and Gemini voluntarily select the two paid x402 products when realistic free alternatives are available.

This is **not** a marketing survey. The primary test leaves `tool_choice` on `auto` and tells each model the actual price:
- `dependency_gate_x402` — $0.015/call
- `release_gate_x402` — $0.04/call

Free competing choices are also exposed:
- local manifest inspection
- local diff inspection
- local project tests

## Primary experiment

30 scenarios × 3 model families × 3 repeats = 270 decisions.

Providers:
- GPT-5.6
- Claude Opus 4.6
- Gemini 3.1 Pro Preview

Metrics:
- voluntary paid-tool selection rate
- dependency-gate selection rate
- release-gate selection rate
- free-local substitution rate
- no-tool rate
- false-positive paid calls on negative tasks
- missed paid calls on high-risk tasks

Run:

```bash
npm install
npm run run
```

Auth is deliberately external to Git:
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_API_KEY`

Never commit keys.

## Agentic experiment

`agentic.yaml` runs closer-to-product coding-agent checks:
- Codex SDK can reuse an existing Codex/ChatGPT CLI login when API keys are unset.
- Claude Agent SDK can reuse an existing Claude Code session with `apiKeyRequired:false`.

Run:

```bash
npm run eval:agentic
npm run report:agentic
```

## Kill rule

Do not rescue a weak product with wording tricks. If high-risk scenarios consistently avoid a paid gate even when its information advantage is relevant, treat that as evidence that the product/value proposition is weak and redesign the product before spending effort on distribution.
