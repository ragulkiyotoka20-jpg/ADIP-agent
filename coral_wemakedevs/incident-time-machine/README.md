# Incident Time-Machine

Incident Time-Machine is a fresh Coral hackathon project for SRE teams. Ask for an outage and get one replay payload that joins incident metadata, deploys, metrics, errors, war-room chat, and crawler evidence.

## Why Coral

The demo executes one real Coral SQL query across six file-backed schemas:

- `pagerduty_demo.incidents`
- `github_demo.deploys`
- `datadog_demo.metrics`
- `sentry_demo.issues`
- `slack_demo.messages`
- `crawler_demo.evidence`

The local fixtures keep the judging demo deterministic and credential-free. Each schema mirrors a live provider that Coral supports or can represent as a custom source. Swap the `_demo` schemas for bundled credentialed sources after adding provider tokens.

## Run The Demo

The repository includes the Windows Coral CLI under `tools/` after running the documented download command. The directory is ignored so the submission stays source-only.

```powershell
npm.cmd run setup
npm.cmd run replay
npm.cmd run catalog
npm.cmd run cache
npm.cmd run mcp:verify
npm.cmd start
```

Open `http://127.0.0.1:4317`.

## Remotion Demo Reel

The submission includes the source for the 66-second Remotion product reel under `remotion/`. Render it with:

```powershell
cd remotion
npm.cmd install
npm.cmd run render
```

The already rendered MP4 is available in the sibling workspace artifact at `../video/out/incident-time-machine.mp4`.

## Coral Features Demonstrated

| Coral capability | Evidence |
| --- | --- |
| SQL interface | `sql/replay.sql` |
| Cross-source joins | Six schemas joined in one query |
| Schema learning | `scripts/catalog.ps1` queries `coral.tables` and `coral.columns` |
| Caching | `scripts/profile-cache.ps1` profiles repeated Coral query execution |
| MCP integration | `.vscode/mcp.json`, `scripts/mcp.ps1`, and `scripts/verify-mcp.mjs` |
| Source authoring | Six linted and tested DSL v3 file-backed source specs |

## Production Upgrade Path

For a live environment, add Coral's bundled `github`, `pagerduty`, `datadog`, `sentry`, and `slack` sources with `coral source add --interactive <source>`. Keep the crawler source file-backed or publish its evidence through a custom HTTP source spec.

## Submission Checklist

- Star the [Coral repository](https://github.com/withcoral/coral).
- Join the [Coral Discord](https://withcoral.com/discord).
- Submit before the event deadline.
