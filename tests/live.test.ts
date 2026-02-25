import { describe, expect, it } from 'vitest';
import { runSimulation } from '../src/engine.js';
import { renderLiveFrame, runSimulationLive } from '../src/live.js';
import type { ScenarioConfig } from '../src/types.js';

const base: ScenarioConfig = {
  name: 'live-test',
  days: 30,
  seed: 21,
  initialPollinators: 120,
  initialPests: 80,
  initialCropHealth: 0.7,
  initialSoilMoisture: 0.6,
  weatherVolatility: 0.3,
  policy: { wateringBudget: 0.5, pesticideCap: 0.4, corridorInvestment: 0.6 },
  spatial: {
    migrationRate: 0.08,
    neighborhoods: [
      { name: 'north', weatherModifier: -0.03, moistureRetention: 1.1, initialPollinators: 135 },
      { name: 'south', weatherModifier: 0.04, moistureRetention: 0.9, initialPollinators: 95 }
    ]
  }
};

describe('live mode', () => {
  it('uses the same deterministic pipeline as batch simulation', async () => {
    const live = await runSimulationLive(base, { intervalMs: 0, maxDays: 12 });
    const batch = runSimulation({ ...base, days: 12 });
    expect(live.averageResilience).toBe(batch.averageResilience);
    expect(live.timeline).toEqual(batch.timeline);
  });

  it('renders key live metrics and neighborhood snapshot', () => {
    const [day] = runSimulation(base).timeline;
    const frame = renderLiveFrame({
      scenarioName: base.name,
      totalDays: base.days,
      intervalMs: 0,
      day
    });
    expect(frame).toContain('Resilience');
    expect(frame).toContain('Pests');
    expect(frame).toContain('Pollinators');
    expect(frame).toContain('Crop health');
    expect(frame).toContain('Neighborhood snapshots');
    expect(frame).toContain('north');
  });
});
