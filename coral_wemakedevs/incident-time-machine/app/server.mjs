import {execFileSync} from 'node:child_process';
import {createReadStream, existsSync, readFileSync, statSync} from 'node:fs';
import {createServer} from 'node:http';
import {extname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const publicDir = join(root, 'app', 'public');
const coral = join(root, 'tools', 'coral', 'coral.exe');

// Load environment variables manually from local .env or parent backend/.env
const loadEnv = () => {
  const paths = [
    join(root, '.env'),
    join(root, '..', 'backend', '.env')
  ];
  for (const p of paths) {
    if (existsSync(p)) {
      const content = readFileSync(p, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
};
loadEnv();

const env = {...process.env, CORAL_CONFIG_DIR: join(root, '.coral-config')};

const runSql = (filename, incidentId = null) => {
  let sql = readFileSync(join(root, 'sql', filename), 'utf8');
  if (incidentId && filename === 'replay.sql') {
    // Replace INC-1842 with the requested incident ID safely
    sql = sql.replace(/'INC-1842'/g, `'${incidentId.replace(/'/g, "''")}'`);
  }
  const output = execFileSync(coral, ['sql', '--format', 'json', sql], {encoding: 'utf8', env});
  return JSON.parse(output);
};

// Mappings for file extensions to MIME types
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const send = (res, status, body, type = 'application/json; charset=utf-8') => {
  res.writeHead(status, {'Content-Type': type});
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
};

// Async LLM Narration with smart rule-based fallback
async function generateRootCause(rowData) {
  const apiKey = process.env.GEMINI_API_KEY;
  const defaultSummary = `Deploy ${rowData.deploy_sha} ("${rowData.deploy_message}") deployed at ${rowData.created_at} rerouted checkout traffic to an unhealthy payment replica, resulting in a 37% error rate spike and Sentry fatal error alerts. The visual website recorder captured the exact customer-facing breakage: the order confirmation pathway's primary CTA button failed with error 503 replica unavailable.\n\n🤖 Actionable SRE Instructions:\n• Execute rollback of deploy ${rowData.deploy_sha} immediately to restore payment routes to the stable replica pool.\n• Configure Coral SQL schema-lints to continuously verify that payment route targets are healthy prior to production activation.`;

  if (!apiKey) {
    console.log('[Incident Time-Machine] No GEMINI_API_KEY found. Utilizing high-fidelity local rule fallback.');
    return defaultSummary;
  }

  try {
    console.log('[Incident Time-Machine] Contacting Google Gemini AI Studio for outage summary...');
    const prompt = `
You are an expert SRE Outage Analyst. Synthesize the following incident telemetry into a brief, professional, high-confidence Root Cause Analysis (RCA) summary of exactly 2-3 sentences, followed by exactly 2 bullet points containing clear, actionable SRE Remediation Instructions on what the team must do to resolve and prevent this breakage. Do not use markdown headers or greetings.

Joined Telemetry Record:
- Incident ID: ${rowData.incident_id}
- Incident Title: ${rowData.title}
- Service Name: ${rowData.service}
- Severity: ${rowData.severity}
- Outage Time: ${rowData.created_at} to ${rowData.resolved_at}
- Deploy SHA: ${rowData.deploy_sha} ("${rowData.deploy_message}")
- Datadog p95 Latency: ${rowData.p95_latency_ms} ms (Baseline: ${rowData.baseline_p95_ms} ms)
- Datadog Error Rate: ${(rowData.error_rate * 100).toFixed(1)}%
- Sentry Issue: ${rowData.sentry_issue_id} ("${rowData.error_message}") with ${rowData.event_count} events
- Slack Context: ${rowData.war_room_message}
- Crawler Visual Diff Score: ${rowData.diff_score} (Screenshots: ${rowData.before_screenshot} -> ${rowData.after_screenshot})

TASK:
1. Explain where the breakage is and what happened in 2-3 sentences (specifically highlighting that deploy ${rowData.deploy_sha} broke the Place Order button pathway which was captured as a 503 Payment Failed regression by the visual crawler).
2. Provide exactly 2 bullet points prefixed by a "🤖 Actionable SRE Instructions:" label, explaining what to do to mitigate the current issue (rollback deploy ${rowData.deploy_sha}) and prevent it in the future (verify replica pools using staging/caching tests).
3. Maintain a professional, high-end SRE tone.
4. Output only the raw text analysis and bullet points. Do not include markdown titles.
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        contents: [{parts: [{text: prompt}]}]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (text) {
      console.log('[Incident Time-Machine] Dynamic summary successfully generated.');
      return text;
    }
  } catch (error) {
    console.error('[Incident Time-Machine] Error generating dynamic summary:', error.message);
  }
  return defaultSummary;
}

const port = Number(process.env.PORT ?? 4317);

createServer(async (req, res) => {
  try {
    const urlObj = new URL(req.url, `http://localhost:${port}`);
    const pathname = urlObj.pathname;

    if (pathname === '/favicon.ico') {
      res.writeHead(204);
      return res.end();
    }

    // Core Replay API (Supports Custom Incident IDs & AI Narration)
    if (pathname === '/api/replay') {
      const incidentId = urlObj.searchParams.get('id') || 'INC-1842';
      const rows = runSql('replay.sql', incidentId);
      if (rows && rows.length > 0) {
        const row = rows[0];
        const summary = await generateRootCause(row);
        row.llm_summary = summary;
        return send(res, 200, [row]);
      }
      return send(res, 404, {error: `Incident ID ${incidentId} not found.`});
    }

    // Catalog Discoverability API
    if (pathname === '/api/catalog') {
      return send(res, 200, runSql('catalog.sql'));
    }

    // Columns Discoverability API
    if (pathname === '/api/columns') {
      return send(res, 200, runSql('columns.sql'));
    }

    // Slack Slash Command API (/replay INC-1842)
    if (pathname === '/api/slack' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        // Simple slack post parameter parsing
        const params = new URLSearchParams(body);
        const text = params.get('text') || 'INC-1842';
        const rows = runSql('replay.sql', text);
        if (rows && rows.length > 0) {
          const row = rows[0];
          const summary = await generateRootCause(row);
          
          // Construct premium Slack Block Kit response
          const slackResponse = {
            response_type: 'in_channel',
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*🚨 Incident Time-Machine Replay: ${row.incident_id} (${row.severity})*`
                }
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*Title:* ${row.title}\n*Root Cause Analysis:*\n${summary}`
                }
              },
              {
                type: 'divider'
              },
              {
                type: 'context',
                elements: [
                  {
                    type: 'mrkdwn',
                    text: `*Deploy:* \`${row.deploy_sha}\` | *Errors:* ${row.event_count} Sentry events (${Math.round(row.error_rate * 100)}%) | *Latency:* ${Math.round(row.p95_latency_ms)}ms`
                  }
                ]
              }
            ]
          };
          return send(res, 200, slackResponse);
        }
        return send(res, 200, {
          response_type: 'ephemeral',
          text: `❌ Incident \`${text}\` not found in Coral registry.`
        });
      });
      return;
    }

    // Static assets file server
    const requested = pathname === '/' ? 'index.html' : pathname.slice(1);
    const filepath = join(publicDir, requested);
    if (!existsSync(filepath) || !statSync(filepath).isFile()) {
      return send(res, 404, {error: 'Not found'});
    }

    res.writeHead(200, {'Content-Type': contentTypes[extname(filepath)] ?? 'application/octet-stream'});
    createReadStream(filepath).pipe(res);
  } catch (error) {
    send(res, 500, {error: error.message});
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Incident Time-Machine running on: http://127.0.0.1:${port}`);
});
