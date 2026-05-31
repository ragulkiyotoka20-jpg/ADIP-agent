SELECT
  i.incident_id,
  i.title,
  i.severity,
  i.service,
  i.created_at,
  i.resolved_at,
  d.sha AS deploy_sha,
  d.message AS deploy_message,
  d.diff_url,
  m.p95_latency_ms,
  m.baseline_p95_ms,
  m.error_rate,
  s.issue_id AS sentry_issue_id,
  s.error_message,
  s.event_count,
  s.issue_url,
  w.author AS war_room_author,
  w.text AS war_room_message,
  w.permalink AS war_room_url,
  before_ui.screenshot_url AS before_screenshot,
  after_ui.screenshot_url AS after_screenshot,
  after_ui.diff_score
FROM pagerduty_demo.incidents i
JOIN github_demo.deploys d
  ON d.deployed_at <= i.created_at
JOIN datadog_demo.metrics m
  ON m.service = i.service
JOIN sentry_demo.issues s
  ON s.service = i.service
  AND s.level = 'fatal'
JOIN slack_demo.messages w
  ON w.channel = 'incidents'
JOIN crawler_demo.evidence before_ui
  ON before_ui.service = i.service
  AND before_ui.phase = 'before'
JOIN crawler_demo.evidence after_ui
  ON after_ui.service = i.service
  AND after_ui.phase = 'after'
WHERE i.incident_id = 'INC-1842'
ORDER BY d.deployed_at DESC
LIMIT 1;

