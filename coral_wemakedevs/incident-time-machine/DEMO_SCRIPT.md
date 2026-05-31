# 90-Second Demo Script

## 0:00 - 0:15

“An outage leaves clues everywhere: PagerDuty, Datadog, Sentry, GitHub, Slack, and the UI customers actually saw. Reconstructing that trail is slow.”

## 0:15 - 0:30

Run:

```powershell
npm.cmd run replay
```

“Incident Time-Machine asks Coral one question and gets one fused incident record back. This is one SQL query across six schemas.”

## 0:30 - 0:48

Show `sql/replay.sql`.

“Coral joins the incident, deploy, metric spike, fatal issue, war-room message, and before-versus-after crawler evidence locally.”

## 0:48 - 1:05

Open `http://127.0.0.1:4317`.

“The UI turns the result into a root-cause replay: deploy `7f3c1a`, a 37% checkout error rate, 4.83-second p95 latency, and the exact screen regression.”

## 1:05 - 1:20

Run:

```powershell
npm.cmd run catalog
npm.cmd run mcp:verify
```

“The same source specs participate in Coral catalog discovery and Coral’s read-only MCP server, so an agent can inspect schemas and query the replay without bespoke tool glue.”

## 1:20 - 1:30

“For production, swap the deterministic fixtures for Coral’s bundled GitHub, PagerDuty, Datadog, Sentry, and Slack sources. Every blurry 2 a.m. alert becomes a clickable documentary.”
