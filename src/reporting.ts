function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function asciiTrend(values: number[]): string {
  if (values.length === 0) return '';
  const chars = '▁▂▃▄▅▆▇█';
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return chars[0].repeat(values.length);
  return values
    .map((v) => {
      const norm = (v - min) / (max - min);
      const idx = Math.round(norm * (chars.length - 1));
      return chars[idx];
    })
    .join('');
}

function linePath(values: number[], width = 920, height = 220): string {
  if (values.length === 0) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((v, i) => {
      const x = values.length === 1 ? 0 : (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

function summaryCards(run: any): string {
  return `
    <div class="cards">
      <div class="card"><h3>Scenario</h3><p>${escapeHtml(String(run.scenario_name))}</p></div>
      <div class="card"><h3>Days</h3><p>${run.days}</p></div>
      <div class="card"><h3>Average resilience</h3><p>${Number(run.average_resilience).toFixed(4)}</p></div>
      <div class="card"><h3>Final resilience</h3><p>${Number(run.final_resilience).toFixed(4)}</p></div>
    </div>
  `;
}

export function buildRunReport(payload: { run: any; days: any[] }): string {
  const { run, days } = payload;
  const resilience = days.map((d) => d.resilience_score);
  const pollinators = days.map((d) => d.pollinators);
  const pests = days.map((d) => d.pests);
  const last = days[days.length - 1];

  return [
    `# Chaos Garden Report — Run ${run.id}`,
    '',
    `Scenario: **${run.scenario_name}**`,
    `Days: **${run.days}**`,
    `Average resilience: **${Number(run.average_resilience).toFixed(4)}**`,
    `Final resilience: **${Number(run.final_resilience).toFixed(4)}**`,
    '',
    '## Trends',
    `- Resilience: \`${asciiTrend(resilience)}\``,
    `- Pollinators: \`${asciiTrend(pollinators)}\``,
    `- Pests: \`${asciiTrend(pests)}\``,
    '',
    '## Last day snapshot',
    `- Pollinators: ${last.pollinators}`,
    `- Pests: ${last.pests}`,
    `- Soil moisture: ${last.soil_moisture}`,
    `- Crop health: ${last.crop_health}`
  ].join('\n');
}

export function buildRunHtmlReport(payload: { run: any; days: any[] }): string {
  const { run, days } = payload;
  const resilience = days.map((d) => Number(d.resilience_score));
  const pollinators = days.map((d) => Number(d.pollinators));
  const pests = days.map((d) => Number(d.pests));
  const neighborhoodByLastDay = days[days.length - 1]?.neighborhoods_json
    ? JSON.parse(String(days[days.length - 1].neighborhoods_json))
    : [];

  const neighborhoodTable = Array.isArray(neighborhoodByLastDay) && neighborhoodByLastDay.length
    ? `
      <h2>Neighborhood snapshot (day ${days[days.length - 1].day})</h2>
      <table>
        <thead><tr><th>Name</th><th>Resilience</th><th>Pollinators</th><th>Pests</th><th>Soil moisture</th></tr></thead>
        <tbody>
          ${neighborhoodByLastDay
            .map(
              (n: any) => `<tr><td>${escapeHtml(String(n.name))}</td><td>${Number(n.resilienceScore).toFixed(4)}</td><td>${Number(n.pollinators).toFixed(2)}</td><td>${Number(n.pests).toFixed(2)}</td><td>${Number(n.soilMoisture).toFixed(4)}</td></tr>`
            )
            .join('')}
        </tbody>
      </table>
    `
    : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Chaos Garden Report — Run ${run.id}</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; margin: 24px auto; max-width: 1080px; padding: 0 20px; color: #17332b; background: #f6faf8; }
    h1, h2 { color: #0f5132; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 16px 0 24px; }
    .card { background: #ffffff; border: 1px solid #d8e9df; border-radius: 10px; padding: 12px; }
    .chart { background: white; border: 1px solid #d8e9df; border-radius: 10px; margin-bottom: 18px; padding: 10px; }
    table { width: 100%; border-collapse: collapse; background: white; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #e5eee9; }
    .legend { display: flex; gap: 16px; font-size: 14px; margin: 10px 0; }
  </style>
</head>
<body>
  <h1>Chaos Garden Report — Run ${run.id}</h1>
  ${summaryCards(run)}
  <h2>Resilience trend</h2>
  <div class="chart">
    <svg viewBox="0 0 920 220" width="100%" role="img" aria-label="Resilience trend">
      <path d="${linePath(resilience)}" stroke="#1f7a53" stroke-width="3" fill="none" />
    </svg>
  </div>
  <h2>Pollinators vs pests</h2>
  <div class="chart">
    <svg viewBox="0 0 920 220" width="100%" role="img" aria-label="Pollinators and pests trends">
      <path d="${linePath(pollinators)}" stroke="#2274a5" stroke-width="3" fill="none" />
      <path d="${linePath(pests)}" stroke="#c94f4f" stroke-width="3" fill="none" />
    </svg>
    <div class="legend"><span>🔵 Pollinators</span><span>🔴 Pests</span></div>
  </div>
  ${neighborhoodTable}
</body>
</html>`;
}

export function buildSweepSummary(rows: any[]): string {
  const lines = ['# Sweep Summary', '', '| Run ID | Scenario | Avg Resilience | Final Resilience |', '|---|---|---:|---:|'];
  for (const row of rows) {
    lines.push(
      `| ${row.id} | ${row.scenario_name} | ${Number(row.average_resilience).toFixed(4)} | ${Number(row.final_resilience).toFixed(4)} |`
    );
  }
  return lines.join('\n');
}
