Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $here
try {
    foreach ($cmd in @('node','npm','codex','claude','gemini')) {
        if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
            throw "NEED_DISCOVERY_CLI_MISSING=$cmd"
        }
    }

    Write-Host 'NEED_DISCOVERY_AUTH_MODE=LOCAL_SUBSCRIPTIONS_OR_FREE_LOGIN'
    Write-Host 'NO_VERCEL_AI_GATEWAY=1'
    Write-Host 'NO_PROVIDER_API_KEYS_REQUIRED=1'
    Write-Host 'Expected auth: Codex via ChatGPT login; Claude Code via Claude app login; Gemini CLI via Google login.'

    npm install --ignore-scripts --no-audit --no-fund
    $pf = node -p "require('./node_modules/promptfoo/package.json').version"
    if ($pf.Trim() -ne '0.122.0') { throw "PROMPTFOO_VERSION_RED=$pf" }

    New-Item -ItemType Directory -Force -Path results | Out-Null
    npx promptfoo eval -c need-discovery-pilot.yaml -o results/needs-pilot.json --no-progress-bar --no-table
    if ($LASTEXITCODE -ne 0) { throw "NEED_DISCOVERY_EVAL_RED=$LASTEXITCODE" }

    node summarize-needs.mjs results/needs-pilot.json | Tee-Object -FilePath results/needs-pilot-report.txt
    if ($LASTEXITCODE -ne 0) { throw "NEED_DISCOVERY_REPORT_RED=$LASTEXITCODE" }

    $json = Get-Content -Raw results/needs-pilot.json | ConvertFrom-Json
    $raw = Get-Content -Raw results/needs-pilot.json
    foreach ($label in @('Codex CLI GPT-5.6 Sol via ChatGPT login','Claude Code Opus via Claude app login','Gemini CLI via Google login')) {
        if (-not $raw.Contains($label)) { throw "NEED_DISCOVERY_PROVIDER_MISSING=$label" }
    }

    Write-Host 'NEED_DISCOVERY_LOCAL_PILOT_GREEN=1'
    Write-Host "RESULT_FILE=$here\results\needs-pilot.json"
    Write-Host "REPORT_FILE=$here\results\needs-pilot-report.txt"
}
finally {
    Pop-Location
}
