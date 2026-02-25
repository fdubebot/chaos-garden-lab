import { describe, expect, it } from 'vitest';
import { runMonteCarlo, stdDev } from '../src/stats.js';
import type { ScenarioConfig } from '../src/types.js';

const base: ScenarioConfig = {
  name: 'mc-test',
  days: 30,
  seed: 100,
  initialPollinators: 120,
  initialPests: 80,
  initialCropHealth: 0.7,
  initialSoilMoisture: 0.6,
  weatherVolatility: 0.35,
  policy: { wateringBudget: 0.45, pesticideCap: 0.5, corridorInvestment: 0.4 }
};

describe('stats', () => {
  it('computes sample std dev', () => {
    const out = stdDev([1, 2, 3, 4]);
    expect(Number(out.toFixed(4))).toBe(1.291);
  });

  it('builds monte carlo confidence interval summary', () => {
    const summary = runMonteCarlo(base, [100, 101, 102, 103, 104], 0.95);
    expect(summary.runs).toBe(5);
    expect(summary.samples).toHaveLength(5);
    expect(summary.ciLow).toBeLessThan(summary.ciHigh);
    expect(summary.mean).toBeGreaterThan(0);
  });
});
