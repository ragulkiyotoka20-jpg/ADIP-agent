$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")
$query = Get-Content -Raw (Join-Path $ProjectRoot "sql\replay.sql")

1..2 | ForEach-Object {
  $timer = [System.Diagnostics.Stopwatch]::StartNew()
  & $Coral sql --format json $query | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Replay query failed." }
  $timer.Stop()
  Write-Host "run=$_ elapsed_ms=$($timer.ElapsedMilliseconds)"
}

