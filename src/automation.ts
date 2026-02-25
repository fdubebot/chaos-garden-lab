import { runSimulation } from './engine.js';
import type { ScenarioConfig, SimulationResult } from './types.js';

export function runPolicySweep(
  base: ScenarioConfig,
  wateringLevels: number[],
  pesticideCaps: number[],
  corridorLevels: number[]
): SimulationResult[] {
  const results: SimulationResult[] = [];
  let idx = 0;

  for (const water of wateringLevels) {
    for (const pesticide of pesticideCaps) {
      for (const corridor of corridorLevels) {
        idx += 1;
        const scenario: ScenarioConfig = {
          ...base,
          name: `${base.name}-sweep-${idx}`,
          seed: base.seed + idx,
          policy: {
            wateringBudget: water,
            pesticideCap: pesticide,
            corridorInvestment: corridor
          }
        };
        results.push(runSimulation(scenario));
      }
    }
  }

  return [...results].sort((a, b) => b.averageResilience - a.averageResilience);
}
