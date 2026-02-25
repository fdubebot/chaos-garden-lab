import { readFileSync } from 'node:fs';
import type { NeighborhoodConfig, ScenarioConfig } from './types.js';

const clamp01 = (n: number, name: string): number => {
  if (n < 0 || n > 1 || Number.isNaN(n)) throw new Error(`${name} must be in [0,1]`);
  return n;
};

const asNeighborhood = (raw: any, index: number): NeighborhoodConfig => ({
  name: String(raw?.name ?? `n${index + 1}`),
  weatherModifier: Number(raw?.weatherModifier ?? 0),
  moistureRetention: Number(raw?.moistureRetention ?? 1),
  initialPollinators: raw?.initialPollinators == null ? undefined : Number(raw.initialPollinators),
  initialPests: raw?.initialPests == null ? undefined : Number(raw.initialPests),
  initialCropHealth: raw?.initialCropHealth == null ? undefined : clamp01(Number(raw.initialCropHealth), 'initialCropHealth'),
  initialSoilMoisture:
    raw?.initialSoilMoisture == null ? undefined : clamp01(Number(raw.initialSoilMoisture), 'initialSoilMoisture')
});

export function parseScenario(raw: any): ScenarioConfig {
  const policy = raw.policy ?? {};
  const spatialRaw = raw.spatial;

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

  if (spatialRaw != null) {
    const neighborhoods = Array.isArray(spatialRaw.neighborhoods)
      ? spatialRaw.neighborhoods.map((n: any, i: number) => asNeighborhood(n, i))
      : [];
    if (neighborhoods.length < 2) {
      throw new Error('spatial.neighborhoods must include at least 2 neighborhoods');
    }
    cfg.spatial = {
      migrationRate: clamp01(Number(spatialRaw.migrationRate ?? 0.05), 'migrationRate'),
      neighborhoods
    };
  }

  return cfg;
}

export function loadScenario(path: string): ScenarioConfig {
  const raw = JSON.parse(readFileSync(path, 'utf-8'));
  return parseScenario(raw);
}
