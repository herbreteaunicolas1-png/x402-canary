$ErrorActionPreference = 'Stop'
$origin = 'https://x402-canary.nicolas-x402-16f380a7.workers.dev'

function Has-Command([string]$name) {
    return $null -ne (Get-Command $name -ErrorAction SilentlyContinue)
}

if (-not (Has-Command 'npx')) {
    throw 'NPX_REQUIRED - install Node.js/npm first'
}

Write-Host '=== AGENTCASH ORIGIN REFRESH ==='
& npx -y agentcash@latest register $origin
if ($LASTEXITCODE -ne 0) { throw "AGENTCASH_REGISTER_RED exit=$LASTEXITCODE" }

Write-Host '=== MERCHANT SKILL ==='
& npx -y agentcash@latest add "$origin/skill.md"
if ($LASTEXITCODE -ne 0) { throw "AGENTCASH_SKILL_RED exit=$LASTEXITCODE" }

Write-Host '=== CLAUDE CODE ==='
if (Has-Command 'claude') {
    $claudeList = (& claude mcp list 2>&1 | Out-String)
    if ($claudeList -notmatch '(?im)\bagentcash\b') {
        & claude mcp add agentcash --scope user -- npx -y agentcash@latest
        if ($LASTEXITCODE -ne 0) { throw "CLAUDE_AGENTCASH_RED exit=$LASTEXITCODE" }
    }
    Write-Host 'CLAUDE_AGENTCASH=GREEN'
} else {
    Write-Host 'CLAUDE_AGENTCASH=SKIPPED_CLIENT_NOT_INSTALLED'
}

Write-Host '=== CODEX ==='
if (Has-Command 'codex') {
    $codexList = (& codex mcp list 2>&1 | Out-String)
    if ($codexList -notmatch '(?im)\bagentcash\b') {
        & codex mcp add agentcash -- npx -y agentcash@latest
        if ($LASTEXITCODE -ne 0) { throw "CODEX_AGENTCASH_RED exit=$LASTEXITCODE" }
    }
    Write-Host 'CODEX_AGENTCASH=GREEN'
} else {
    Write-Host 'CODEX_AGENTCASH=SKIPPED_CLIENT_NOT_INSTALLED'
}

Write-Host '=== GEMINI CLI ==='
if (Has-Command 'gemini') {
    $geminiList = (& gemini mcp list 2>&1 | Out-String)
    if ($geminiList -notmatch '(?im)\bagentcash\b') {
        & gemini mcp add agentcash npx -y agentcash@latest --scope user
        if ($LASTEXITCODE -ne 0) { throw "GEMINI_AGENTCASH_RED exit=$LASTEXITCODE" }
    }
    Write-Host 'GEMINI_AGENTCASH=GREEN'
} else {
    Write-Host 'GEMINI_AGENTCASH=SKIPPED_CLIENT_NOT_INSTALLED'
}

Write-Host '=== AGENTCASH DISCOVERY ==='
$discover = (& npx -y agentcash@latest --format json discover $origin 2>&1 | Out-String)
foreach ($route in @('/v1/agent/npm-symbol-context','/v1/agent/npm-api-diff','/v1/agent/browser-context')) {
    if ($discover -notmatch [regex]::Escape($route)) { throw "DISCOVERY_RED $route" }
    Write-Host "DISCOVERY_GREEN $route"
}

Write-Host '=== SEARCH VISIBILITY GATE ==='
$queries = @(
    'npm docs TypeScript API exact package version',
    'npm package upgrade breaking changes TypeScript migration',
    'browser snapshot JavaScript rendered web page accessibility'
)
$hits = 0
foreach ($q in $queries) {
    $out = (& npx -y agentcash@latest --format json search $q 2>&1 | Out-String)
    if ($out -match [regex]::Escape('x402-canary.nicolas-x402-16f380a7.workers.dev')) {
        $hits++
        Write-Host "SEARCH_GREEN $q"
    } else {
        Write-Host "SEARCH_RED $q"
    }
}
if ($hits -lt 3) { throw "AGENT_SEARCH_VISIBILITY_RED hits=$hits/3" }

Write-Host 'THREE_AGENT_BRANCHING=GREEN'
Write-Host 'AGENT_VISIBILITY_GATE=GREEN'
Write-Host 'NO_PAYMENT_SENT=1'
