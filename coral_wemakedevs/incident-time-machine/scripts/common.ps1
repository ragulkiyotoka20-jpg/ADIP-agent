$ProjectRoot = Split-Path -Parent $PSScriptRoot
$env:CORAL_CONFIG_DIR = Join-Path $ProjectRoot ".coral-config"
$Coral = Join-Path $ProjectRoot "tools\coral\coral.exe"

if (-not (Test-Path $Coral)) {
  throw "Coral CLI missing. Download the Windows release into tools/coral first."
}

