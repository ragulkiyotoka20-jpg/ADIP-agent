$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

& $Coral sql --format json (Get-Content -Raw (Join-Path $ProjectRoot "sql\replay.sql"))
if ($LASTEXITCODE -ne 0) { throw "Replay query failed." }

