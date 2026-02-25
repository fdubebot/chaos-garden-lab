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

export function buildSweepSummary(rows: any[]): string {
  const lines = [
    '# Sweep Summary',
    '',
    '| Run ID | Scenario | Avg Resilience | Final Resilience |',
    '|---|---|---:|---:|'
  ];
  for (const row of rows) {
    lines.push(
      `| ${row.id} | ${row.scenario_name} | ${Number(row.average_resilience).toFixed(4)} | ${Number(row.final_resilience).toFixed(4)} |`
    );
  }
  return lines.join('\n');
}
