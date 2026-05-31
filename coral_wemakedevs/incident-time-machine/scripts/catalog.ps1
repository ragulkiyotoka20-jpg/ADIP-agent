$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

Write-Host "[tables]"
& $Coral sql --format table (Get-Content -Raw (Join-Path $ProjectRoot "sql\catalog.sql"))
Write-Host "[columns]"
& $Coral sql --format table (Get-Content -Raw (Join-Path $ProjectRoot "sql\columns.sql"))

