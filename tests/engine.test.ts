import { describe, expect, it } from 'vitest';
import { runSimulation } from '../src/engine.js';
import type { ScenarioConfig } from '../src/types.js';

const base: ScenarioConfig = {
  name: 'test',
  days: 40,
  seed: 123,
  initialPollinators: 120,
  initialPests: 80,
  initialCropHealth: 0.7,
  initialSoilMoisture: 0.6,
  weatherVolatility: 0.3,
  policy: { wateringBudget: 0.4, pesticideCap: 0.5, corridorInvestment: 0.3 }
};

describe('engine', () => {
  it('is deterministic for same seed', () => {
    const a = runSimulation(base);
    const b = runSimulation(base);
    expect(a.averageResilience).toBe(b.averageResilience);
    expect(a.timeline[39].resilienceScore).toBe(b.timeline[39].resilienceScore);
  });

  it('policy choices affect outcomes', () => {
    const strong = runSimulation({
      ...base,
      policy: { wateringBudget: 0.8, pesticideCap: 0.3, corridorInvestment: 0.8 }
    });
    const weak = runSimulation({
      ...base,
      policy: { wateringBudget: 0.1, pesticideCap: 0.95, corridorInvestment: 0.0 }
    });
    expect(strong.averageResilience).toBeGreaterThan(weak.averageResilience);
  });
});
