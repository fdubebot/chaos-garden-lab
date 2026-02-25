import { readFileSync } from 'node:fs';
import type { ScenarioConfig } from './types.js';

const clamp01 = (n: number, name: string): number => {
  if (n < 0 || n > 1) throw new Error(`${name} must be in [0,1]`);
  return n;
};

export function parseScenario(raw: any): ScenarioConfig {
  const policy = raw.policy ?? {};
  const cfg: ScenarioConfig = {
    name: String(raw.name ?? 'unnamed-scenario'),
    days: Number(raw.days ?? 90),
    seed: Number(raw.seed ?? 42),
    initialPollinators: Number(raw.initialPollinators ?? 120),
    initialPests: Number(raw.initialPests ?? 80),
    initialCropHealth: clamp01(Number(raw.initialCropHealth ?? 0.7), 'initialCropHealth'),
    initialSoilMoisture: clamp01(Number(raw.initialSoilMoisture ?? 0.6), 'initialSoilMoisture'),
    weatherVolatility: clamp01(Number(raw.weatherVolatility ?? 0.35), 'weatherVolatility'),
    policy: {
      wateringBudget: clamp01(Number(policy.wateringBudget ?? 0.4), 'wateringBudget'),
      pesticideCap: clamp01(Number(policy.pesticideCap ?? 0.5), 'pesticideCap'),
      corridorInvestment: clamp01(Number(policy.corridorInvestment ?? 0.3), 'corridorInvestment')
    }
  };
  if (cfg.days <= 0) throw new Error('days must be > 0');
  return cfg;
}

export function loadScenario(path: string): ScenarioConfig {
  const raw = JSON.parse(readFileSync(path, 'utf-8'));
  return parseScenario(raw);
}
