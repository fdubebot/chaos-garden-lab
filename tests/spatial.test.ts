import { describe, expect, it } from 'vitest';
import { runSimulation } from '../src/engine.js';
import type { ScenarioConfig } from '../src/types.js';

const base: ScenarioConfig = {
  name: 'spatial',
  days: 25,
  seed: 5,
  initialPollinators: 120,
  initialPests: 80,
  initialCropHealth: 0.7,
  initialSoilMoisture: 0.6,
  weatherVolatility: 0.3,
  policy: { wateringBudget: 0.5, pesticideCap: 0.4, corridorInvestment: 0.5 },
  spatial: {
    migrationRate: 0.12,
    neighborhoods: [
      { name: 'north', weatherModifier: -0.05, moistureRetention: 1.1, initialPollinators: 140 },
      { name: 'south', weatherModifier: 0.06, moistureRetention: 0.9, initialPollinators: 90 }
    ]
  }
};

describe('spatial neighborhoods', () => {
  it('emits neighborhood-level day states and aggregate timeline', () => {
    const result = runSimulation(base);
    expect(result.spatial?.neighborhoodCount).toBe(2);
    const dayOne = result.timeline[0];
    expect(dayOne.neighborhoods).toHaveLength(2);
    expect(dayOne.pollinators).toBeGreaterThan(0);
  });
});
