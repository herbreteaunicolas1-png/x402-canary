import { spawnSync } from "node:child_process";

const kind = process.argv[2];
const prompt = process.argv[3] ?? "";
if (!kind || !prompt) {
  console.error("usage: node cli-provider.mjs <codex|claude|gemini> <prompt>");
  process.exit(2);
}

function cleanEnv(remove) {
  const env = { ...process.env };
  for (const key of remove) delete env[key];
  return env;
}

function run(command, args, env) {
  const r = spawnSync(command, args, { encoding: "utf8", env, maxBuffer: 8_000_000, timeout: 180_000, windowsHide: true });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`${command}_exit_${r.status}: ${String(r.stderr || r.stdout).slice(0, 1500)}`);
  return String(r.stdout ?? "").trim();
}

function stripFence(text) {
  const trimmed = text.trim();
  const m = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  return (m?.[1] ?? trimmed).trim();
}

function codexText(stdout) {
  const messages = [];
  for (const line of stdout.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("{")) continue;
    try {
      const event = JSON.parse(trimmed);
      const item = event.item ?? event.msg ?? event;
      if (item?.type === "agent_message" && typeof item.text === "string") messages.push(item.text);
      if (event?.type === "item.completed" && event.item?.type === "agent_message" && typeof event.item.text === "string") messages.push(event.item.text);
      if (typeof event?.output_text === "string") messages.push(event.output_text);
    } catch {}
  }
  if (!messages.length) throw new Error(`codex_output_unparsed: ${stdout.slice(-1500)}`);
  return stripFence(messages[messages.length - 1]);
}

function claudeText(stdout) {
  const parsed = JSON.parse(stdout);
  const value = parsed.result ?? parsed.response ?? parsed.output;
  if (typeof value !== "string") throw new Error("claude_output_unparsed");
  return stripFence(value);
}

function geminiText(stdout) {
  const parsed = JSON.parse(stdout);
  const value = parsed.response ?? parsed.result ?? parsed.output;
  if (typeof value !== "string") throw new Error("gemini_output_unparsed");
  return stripFence(value);
}

try {
  let text;
  if (kind === "codex") {
    const env = cleanEnv(["OPENAI_API_KEY", "CODEX_API_KEY", "OPENAI_BASE_URL"]);
    text = codexText(run("codex", ["exec", "--json", "--skip-git-repo-check", "-m", "gpt-5.6-sol", prompt], env));
  } else if (kind === "claude") {
    const env = cleanEnv(["ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_BASE_URL", "CLAUDE_CODE_USE_BEDROCK", "CLAUDE_CODE_USE_VERTEX"]);
    text = claudeText(run("claude", ["-p", prompt, "--output-format", "json", "--model", "opus", "--permission-mode", "plan", "--max-turns", "1"], env));
  } else if (kind === "gemini") {
    const env = cleanEnv(["GEMINI_API_KEY", "GOOGLE_API_KEY", "GOOGLE_GENAI_USE_VERTEXAI"]);
    text = geminiText(run("gemini", ["-p", prompt, "--output-format", "json"], env));
  } else {
    throw new Error(`unknown_provider=${kind}`);
  }

  JSON.parse(text);
  process.stdout.write(text);
} catch (error) {
  console.error(String(error instanceof Error ? error.message : error));
  process.exit(1);
}
