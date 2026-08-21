# x402 Buyer / Need Discovery Lab

The lab has two separate purposes:

1. **Need discovery first** — ask real coding-agent model families what external evidence/action they genuinely lack before any product is proposed.
2. **Product selection second** — only after a need exists, measure whether a concrete paid tool is voluntarily selected over free local evidence.

## No paid AI Gateway

The Need Discovery pilot does **not** use Vercel AI Gateway and does not require OpenAI/Anthropic/Google developer API keys.

It runs locally through existing authenticated CLIs:
- Codex CLI using the user's ChatGPT/Codex login;
- Claude Code using the user's Claude app login;
- Gemini CLI using Google login.

`cli-provider.mjs` removes provider API-key environment variables before spawning those CLIs so a forgotten developer key does not silently turn the calibration into separate API spend.

The pilot is intentionally bounded and `maxConcurrency: 1`.

## Run Need Discovery on Windows

From the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\buyer-lab\run-local-need-discovery.ps1
```

Prerequisites:
- `codex` installed and logged in;
- `claude` installed and logged in;
- `gemini` installed and logged in;
- Node/npm available.

The script installs the pinned Promptfoo version, runs the bounded cross-model pilot and writes:
- `buyer-lab/results/needs-pilot.json`
- `buyer-lab/results/needs-pilot-report.txt`

Do not claim `NEED_DISCOVERY_GREEN` unless the real result contains all three providers.

## What the models are asked

They are given realistic engineering tasks and free local capabilities. They are **not shown our products**. They must first decide whether local evidence is sufficient. When it is not, they describe only the missing external capability, exact trigger, frequency, freshness, latency tolerance and maximum worthwhile per-call price.

That evidence is used to decide what to build next.

## Live buyer funnel

The production Worker separately exposes a free need router:

- MCP: `find_paid_tool`
- HTTP: `POST /agent/find-tool`

This live router is not the same thing as the Promptfoo study. It captures revealed need at the point an external agent is deciding whether it requires paid external evidence. It never stores the raw task text. It returns a paid recommendation only if the need matches an available capability and fits the buyer's stated budget; otherwise it records an unmet need for future product design.

## Existing paid-selection experiment

The older `promptfooconfig.yaml` experiment still measures voluntary selection of Dependency Gate and Release Gate versus free alternatives. It is secondary evidence; it must not override the Need Discovery evidence.

## Kill / build rule

Do not rescue a weak product with wording tricks. Build only when need evidence, buyer trigger, distribution path and economics converge. A product with no independent purchases remains unproven regardless of route count or deployment status.
