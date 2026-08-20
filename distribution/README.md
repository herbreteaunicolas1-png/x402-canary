# Agent-native distribution

Canonical merchant: `https://x402-canary.nicolas-x402-16f380a7.workers.dev`.

- Claude Code: `distribution/claude-plugin/`
- Codex: `distribution/codex-skill/`
- Gemini CLI: `distribution/gemini-extension/`
- Buyer payment/discovery: AgentCash MCP
- Machine discovery: `/openapi.json`, `/llms.txt`, `/llms-full.txt`, `/skill.md`, `/.well-known/mcp.json`

The wrappers create the purchase moment; they do not duplicate business logic or payment logic. The only paid execution authority is the canonical Worker.
