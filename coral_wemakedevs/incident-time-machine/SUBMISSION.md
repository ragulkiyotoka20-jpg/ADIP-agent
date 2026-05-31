# Incident Time-Machine Submission

## One-Line Pitch

Incident Time-Machine turns an outage into a replay by joining alerts, deploys, metrics, errors, war-room chat, and live UI evidence through one Coral SQL query.

## Problem

SRE teams reconstruct incidents manually across PagerDuty, GitHub, Datadog, Sentry, Slack, and screenshots. That slows root-cause analysis and makes post-mortems harder to trust.

## Solution

Ask: `Show me the 18-minute outage at 02:10 UTC.`

Get:

- a fused Coral query result
- an auto-generated root-cause summary
- a customer-impact timeline
- before/after crawler evidence
- links to the code diff, alert, and screen diff

## Best Use Of Coral

- Six schemas are joined in one SQL statement: `sql/replay.sql`.
- Six DSL v3 file-backed source specs make the demo deterministic without credentials.
- `scripts/catalog.ps1` demonstrates schema learning through `coral.tables` and `coral.columns`.
- `scripts/profile-cache.ps1` profiles repeated replay queries.
- `scripts/verify-mcp.mjs` proves the Coral MCP server exposes `sql`, `list_catalog`, `search_catalog`, `describe_table`, and `list_columns`.
- The production path swaps demo schemas for Coral's bundled GitHub, PagerDuty, Datadog, Sentry, and Slack sources.

## Demo Commands

```powershell
npm.cmd run setup
npm.cmd run replay
npm.cmd run catalog
npm.cmd run cache
npm.cmd run mcp:verify
npm.cmd start
```

Open `http://127.0.0.1:4317`.

## Track

Track 1: Enterprise Agent
