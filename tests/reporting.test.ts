import { describe, expect, it } from 'vitest';
import { asciiTrend, buildRunHtmlReport } from '../src/reporting.js';

describe('reporting', () => {
  it('creates sparkline-like output', () => {
    const out = asciiTrend([0.1, 0.2, 0.8, 0.3]);
    expect(out.length).toBe(4);
    expect(out[0]).not.toBe(out[2]);
  });

  it('builds html report with svg trends', () => {
    const html = buildRunHtmlReport({
      run: { id: 1, scenario_name: 'demo', days: 2, average_resilience: 0.7, final_resilience: 0.72 },
      days: [
        { day: 1, resilience_score: 0.69, pollinators: 120, pests: 80 },
        { day: 2, resilience_score: 0.72, pollinators: 140, pests: 77 }
      ]
    });
    expect(html).toContain('<svg');
    expect(html).toContain('Chaos Garden Report');
    expect(html).toContain('Pollinators vs pests');
  });
});
