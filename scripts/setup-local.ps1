# Local setup (Windows PowerShell). From repo root: .\scripts\setup-local.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent

Write-Host "Repo: $root"
Set-Location $root

if (-not (Test-Path "$root\server\.env")) {
  @"
PORT=5000
MONGODB_URI=memory
JWT_SECRET=flowtrack-local-dev-secret-change-me
CLIENT_URL=http://localhost:5173
"@ | Set-Content -Path "$root\server\.env" -Encoding utf8
  Write-Host "Created server\.env (in-memory MongoDB — no install needed)."
} else {
  Write-Host "server\.env already exists — leaving it as-is."
}

npm install
npm run install:all
Write-Host ""
Write-Host "Done. Start the app with: npm run dev"
Write-Host "Then open http://localhost:5173"
