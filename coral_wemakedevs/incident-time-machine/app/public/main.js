const sources = [
  {code: 'PD', name: 'PagerDuty', detail: 'alert triage'},
  {code: 'GH', 'name': 'GitHub', detail: 'deploy SHA'},
  {code: 'DD', 'name': 'Datadog', detail: 'latency metrics'},
  {code: 'SE', 'name': 'Sentry', detail: 'fatal issues'},
  {code: 'SL', 'name': 'Slack', detail: 'war-room text'},
  {code: 'UI', 'name': 'Crawler', detail: 'visual capture'},
];

// Load connected sources status grid
const sourceContainer = document.querySelector('#sources');
sourceContainer.innerHTML = sources.map((s, idx) => `
  <article class="source-card" id="source-${s.code}">
    <div class="code">${s.code}</div>
    <div class="details">
      <strong>${s.name}</strong>
      <span class="detail-label">${s.detail}</span>
    </div>
  </article>
`).join('');

// Replay state tracking
let isReplayed = false;
let currentIncidentData = null;

// Dynamic Datadog Canvas Telemetry Chart
const drawDatadogChart = (canvas, p95, baseline, progress = 1.0) => {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  ctx.clearRect(0, 0, w, h);

  // Grid background lines
  ctx.strokeStyle = 'rgba(158, 184, 204, 0.08)';
  ctx.lineWidth = 1;
  for (let y = 20; y < h; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Draw Baseline limit
  ctx.strokeStyle = '#b9ef80';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  const baselineY = h - (baseline / p95) * (h - 60) - 30;
  ctx.moveTo(0, baselineY);
  ctx.lineTo(w, baselineY);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Baseline label
  ctx.fillStyle = '#b9ef80';
  ctx.font = '10px monospace';
  ctx.fillText(`Baseline: ${Math.round(baseline)}ms`, 10, baselineY - 6);

  // Latency Curve points
  const points = [
    {x: 0, y: h - 25},
    {x: w * 0.15, y: h - 26},
    {x: w * 0.25, y: h - 25},
    {x: w * 0.35, y: h - 27},
    {x: w * 0.42, y: h - 70},
    {x: w * 0.48, y: 25}, // Outage spike starts at 02:10 (T+6s)
    {x: w * 0.55, y: 22},
    {x: w * 0.65, y: 26},
    {x: w * 0.72, y: h - 23}, // Rollback completed (T+39s)
    {x: w * 0.85, y: h - 25},
    {x: w * 1.0, y: h - 26}
  ];

  // Draw Neon Latency curve
  ctx.strokeStyle = '#ff7f6d';
  ctx.shadowColor = 'rgba(255, 127, 109, 0.5)';
  ctx.shadowBlur = 8;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  
  const endLimit = Math.max(2, Math.floor(points.length * progress));
  for (let i = 1; i < endLimit; i++) {
    const xc = (points[i].x + points[i - 1].x) / 2;
    const yc = (points[i].y + points[i - 1].y) / 2;
    ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
  }
  ctx.stroke();
  
  ctx.shadowBlur = 0; // reset
};

// Core Replay Function
const executeReplay = async (incidentId = 'INC-1842') => {
  const button = document.querySelector('#replay');
  button.disabled = true;
  button.textContent = 'Querying Coral SQL...';

  // Pulse connected sources as querying starts
  sources.forEach(s => {
    document.querySelector(`#source-${s.code}`).classList.remove('active');
  });

  try {
    const response = await fetch(`/api/replay?id=${incidentId}`);
    if (!response.ok) {
      throw new Error(`Outage record ${incidentId} not found in Coral registry.`);
    }

    const [row] = await response.json();
    currentIncidentData = row;

    // Trigger sequential glowing activations of Coral schemas
    let activeDelay = 0;
    sources.forEach((s) => {
      setTimeout(() => {
        document.querySelector(`#source-${s.code}`).classList.add('active');
      }, activeDelay);
      activeDelay += 180;
    });

    // Populate Outage Details
    document.querySelector('#title').textContent = `${row.severity}: ${row.title}`;
    document.querySelector('#rootCause').textContent = row.llm_summary;
    document.querySelector('#latency').textContent = `${Math.round(row.p95_latency_ms)} ms`;
    document.querySelector('#baseline-latency').textContent = `${Math.round(row.baseline_p95_ms)} ms`;
    document.querySelector('#errorRate').textContent = `${Math.round(row.error_rate * 100)}%`;
    document.querySelector('#events').textContent = row.event_count.toLocaleString();
    document.querySelector('#diff-score-value').textContent = row.diff_score.toFixed(2);
    document.querySelector('#trace-deploy-sha').textContent = row.deploy_sha;
    document.querySelector('#trace-diff-score').textContent = row.diff_score.toFixed(2);

    // Populate Evidence Receipts Links
    document.querySelector('#evidence').innerHTML = [
      {label: 'code diff', url: row.diff_url},
      {label: 'alert context', url: row.issue_url},
      {label: 'screen diff', url: '/app-ui.png'},
    ].map(e => `<a href="${e.url}" target="_blank"><b>${e.label}</b><span>${e.url}</span></a>`).join('');

    // Populate Timeline Moments
    const momentsData = [
      {time: '02:09', title: 'Deploy completed', detail: `checkout-service / ${row.deploy_sha}`, triggerTime: 6},
      {time: '02:10', title: 'Errors spike', detail: `${Math.round(row.error_rate * 100)}% checkout failures`, isAlert: true, triggerTime: 13},
      {time: '02:11', title: 'UI evidence captured', detail: 'payment CTA regression', triggerTime: 23},
      {time: '02:28', title: 'Rollback restored', detail: 'latency back to baseline', triggerTime: 39},
    ];

    document.querySelector('#moments').innerHTML = momentsData.map((m, idx) => `
      <article class="moment-card ${m.isAlert ? 'alert' : ''}" id="moment-${idx}">
        <span class="moment-time">${m.time} UTC</span>
        <strong>${m.title}</strong>
        <span>${m.detail}</span>
      </article>
    `).join('');

    // Initialize Canvas Chart values
    const canvas = document.querySelector('#datadog-canvas');
    if (canvas) {
      drawDatadogChart(canvas, row.p95_latency_ms, row.baseline_p95_ms, 1.0);
    }

    // Launch Slack Modal Simulation to display block kit response
    const modal = document.querySelector('#slack-modal');
    document.querySelector('#slack-card-title').textContent = `${row.incident_id}: ${row.title}`;
    document.querySelector('#slack-card-summary').textContent = row.llm_summary;
    document.querySelector('#slack-card-sha').textContent = row.deploy_sha;
    document.querySelector('#slack-card-errors').textContent = `${Math.round(row.error_rate * 100)}%`;
    document.querySelector('#slack-card-latency').textContent = `${Math.round(row.p95_latency_ms)} ms`;
    document.querySelector('#slack-card-sentry').textContent = row.sentry_issue_id;
    document.querySelector('#slack-msg-time').textContent = `${row.created_at.split('T')[1].substring(0, 5)} UTC`;
    
    // Populate CTO Board Slide Deck metrics
    document.querySelector('#slide-1-errors').textContent = `${Math.round(row.error_rate * 100)}%`;
    document.querySelector('#slide-1-latency').textContent = `${Math.round(row.p95_latency_ms)} ms`;
    document.querySelector('#slide-1-events').textContent = row.event_count.toLocaleString();
    document.querySelector('#slide-2-sha').textContent = row.deploy_sha;

    // Animate Modal show
    setTimeout(() => {
      modal.classList.remove('hidden');
    }, 1200);

    button.disabled = false;
    button.textContent = 'Replay Complete';
    isReplayed = true;

  } catch (error) {
    document.querySelector('#title').textContent = 'Coral query failed';
    document.querySelector('#rootCause').textContent = error.message;
    button.disabled = false;
    button.textContent = 'Retry Replay';
  }
};

// Video Telemetry Timeline Synchronizer
const video = document.querySelector('#replay-video');
video.addEventListener('timeupdate', () => {
  if (!isReplayed || !currentIncidentData) return;

  const duration = video.duration || 66;
  const current = video.currentTime;
  const progressPercent = Math.min(100, (current / duration) * 100);

  // Sync timeline fill bar
  document.querySelector('#timeline-fill').style.height = `${progressPercent}%`;

  // Draw chart progress based on playback time
  const canvas = document.querySelector('#datadog-canvas');
  if (canvas) {
    drawDatadogChart(canvas, currentIncidentData.p95_latency_ms, currentIncidentData.baseline_p95_ms, Math.min(1.0, current / 45));
  }

  // Light up sequential timeline cards as video scrub moves
  const momentTriggers = [6, 13, 23, 39];
  momentTriggers.forEach((trigger, idx) => {
    const card = document.querySelector(`#moment-${idx}`);
    if (card) {
      if (current >= trigger) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    }
  });
});

// Tab Switchers (Video player / Canvas charts)
document.querySelector('#tab-video').addEventListener('click', (e) => {
  document.querySelector('#tab-video').classList.add('active');
  document.querySelector('#tab-metrics').classList.remove('active');
  document.querySelector('#replay-video').classList.remove('hidden');
  document.querySelector('#interactive-chart').classList.add('hidden');
});

document.querySelector('#tab-metrics').addEventListener('click', (e) => {
  document.querySelector('#tab-video').classList.remove('active');
  document.querySelector('#tab-metrics').classList.add('active');
  document.querySelector('#replay-video').classList.add('hidden');
  document.querySelector('#interactive-chart').classList.remove('hidden');
  
  // Redraw canvas on view shift
  setTimeout(() => {
    const canvas = document.querySelector('#datadog-canvas');
    if (canvas && currentIncidentData) {
      drawDatadogChart(canvas, currentIncidentData.p95_latency_ms, currentIncidentData.baseline_p95_ms, 1.0);
    }
  }, 50);
});

// Explorer tabs switching
document.querySelector('#explorer-sql-tab').addEventListener('click', () => {
  document.querySelector('#explorer-sql-tab').classList.add('active');
  document.querySelector('#explorer-catalog-tab').classList.remove('active');
  document.querySelector('#explorer-sql-content').classList.remove('hidden');
  document.querySelector('#explorer-catalog-content').classList.add('hidden');
});

document.querySelector('#explorer-catalog-tab').addEventListener('click', async () => {
  document.querySelector('#explorer-sql-tab').classList.remove('active');
  document.querySelector('#explorer-catalog-tab').classList.add('active');
  document.querySelector('#explorer-sql-content').classList.add('hidden');
  document.querySelector('#explorer-catalog-content').classList.remove('hidden');

  // Load catalog discoverability columns live
  try {
    const tablesResponse = await fetch('/api/catalog');
    const columnsResponse = await fetch('/api/columns');
    
    if (tablesResponse.ok && columnsResponse.ok) {
      const tables = await tablesResponse.json();
      const columns = await columnsResponse.json();

      document.querySelector('#table-count').textContent = tables.length;

      // Render schemas
      document.querySelector('#catalog-tables-list tbody').innerHTML = tables.map(t => `
        <tr>
          <td><strong>${t.schema_name}</strong></td>
          <td><code>${t.table_name}</code></td>
        </tr>
      `).join('');

      // Render columns
      document.querySelector('#catalog-columns-list tbody').innerHTML = columns.map(c => `
        <tr>
          <td><span style="color:#ff7f6d">${c.schema_name}</span></td>
          <td><code>${c.table_name}</code></td>
          <td><strong>${c.column_name}</strong></td>
          <td><span style="color:#52d7f4; font-size:12px;">${c.data_type}</span></td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Catalog fetch error:', err.message);
  }
});

// Copy SQL to clipboard
document.querySelector('#copy-sql-btn').addEventListener('click', () => {
  const sql = document.querySelector('#sql-code-display').textContent;
  navigator.clipboard.writeText(sql).then(() => {
    const btn = document.querySelector('#copy-sql-btn');
    btn.textContent = 'SQL Copied!';
    setTimeout(() => { btn.textContent = 'Copy SQL Query'; }, 2000);
  });
});

// Slack modal closure
document.querySelector('#slack-modal-close-btn').addEventListener('click', () => {
  document.querySelector('#slack-modal').classList.add('hidden');
});

// Trigger Slack Command simulation
document.querySelector('#replay').addEventListener('click', () => {
  const idInput = document.querySelector('#slack-command-input').value.trim();
  executeReplay(idInput || 'INC-1842');
});

// ==========================================================================
// CTO Board Slide Deck Modal & Navigation Logic
// ==========================================================================
let currentSlide = 1;
const showSlide = (idx) => {
  currentSlide = idx;
  document.querySelectorAll('.board-slide').forEach(slide => {
    slide.classList.add('hidden');
    slide.classList.remove('active');
  });
  document.querySelector(`#slide-${idx}`).classList.remove('hidden');
  document.querySelector(`#slide-${idx}`).classList.add('active');

  document.querySelector('#slide-indicator-text').textContent = `Slide ${idx} of 3`;
  document.querySelector('#prev-slide-btn').disabled = (idx === 1);
  document.querySelector('#next-slide-btn').disabled = (idx === 3);
};

// Modal open/close listeners
document.querySelector('#view-deck-btn').addEventListener('click', () => {
  document.querySelector('#deck-modal').classList.remove('hidden');
  showSlide(1);
});

document.querySelector('#deck-modal-close-btn').addEventListener('click', () => {
  document.querySelector('#deck-modal').classList.add('hidden');
});

// Slider buttons
document.querySelector('#prev-slide-btn').addEventListener('click', () => {
  if (currentSlide > 1) {
    showSlide(currentSlide - 1);
  }
});

document.querySelector('#next-slide-btn').addEventListener('click', () => {
  if (currentSlide < 3) {
    showSlide(currentSlide + 1);
  }
});

// Bootstrap execution
executeReplay('INC-1842');

