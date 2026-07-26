$env:GIT_TERMINAL_PROMPT = "0"
$backupDir = "C:\Users\Guru\Desktop\Agent_Backup"
$mainRepo = "c:\Users\Guru\Desktop\ADIP"

$agents = @(
    @{ source = "orchestrator-agent"; branch = "orchestrator-agent" },
    @{ source = "universal-director-agent"; branch = "universal-director-agent" },
    @{ source = "qa-agent"; branch = "qa-agent" },
    @{ source = "release-intelligence"; branch = "release-intelligence" },
    @{ source = "documentation"; branch = "documentation" },
    @{ source = "codex-knowledge-graph"; branch = "codex/knowledge-graph" },
    @{ source = "explorer"; branch = "explorer" },
    @{ source = "main"; branch = "main" }
)

Set-Location $mainRepo

foreach ($ag in $agents) {
    $srcFolder = Join-Path $backupDir $ag.source
    $branchName = $ag.branch

    Write-Host "=================================================="
    Write-Host "Updating Branch: $branchName from $srcFolder"
    Write-Host "=================================================="

    # Checkout branch cleanly
    git checkout -f $branchName
    if ($LASTEXITCODE -ne 0) {
        git checkout -B $branchName "origin/$branchName"
    }

    # Remove existing tracked files
    git rm -rf . -q -ErrorAction SilentlyContinue

    # Copy updated code from Agent_Backup
    Copy-Item -Path "$srcFolder\*" -Destination $mainRepo -Recurse -Force

    # Ensure gitignore is present
    Set-Content -Path "$mainRepo\.gitignore" -Value "Agent/`napplications/`n*.mp4`n*.webm`n*.mp3`n*.db`n*.zip`ntemp*`nwt_*"

    # Stage, commit, and push
    git add -A
    git commit -m "refactor: update $branchName agent codebase with latest implementation"
    git push origin HEAD:refs/heads/$branchName --force

    Write-Host "Successfully updated and pushed branch: $branchName`n"
}

# Return to orchestrator-agent
git checkout -f orchestrator-agent
Write-Host "ALL 8 AGENT BRANCHES PUSHED TO GITHUB!"
