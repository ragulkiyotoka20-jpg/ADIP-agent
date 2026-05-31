$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

$sources = Get-ChildItem (Join-Path $ProjectRoot "coral\sources\*.yaml") | Sort-Object Name

foreach ($source in $sources) {
  Write-Host "[lint] $($source.Name)"
  & $Coral source lint $source.FullName
  if ($LASTEXITCODE -ne 0) { throw "Lint failed: $($source.Name)" }

  Write-Host "[install] $($source.Name)"
  & $Coral source add --file $source.FullName
  if ($LASTEXITCODE -ne 0) { throw "Install failed: $($source.Name)" }

  $name = [System.IO.Path]::GetFileNameWithoutExtension($source.Name).Replace("-", "_")
  Write-Host "[test] $name"
  & $Coral source test $name
  if ($LASTEXITCODE -ne 0) { throw "Test failed: $name" }
}

Write-Host "[catalog]"
& $Coral sql --format json (Get-Content -Raw (Join-Path $ProjectRoot "sql\catalog.sql"))

