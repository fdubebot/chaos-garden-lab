import type { DayState, NeighborhoodDayState, ScenarioConfig, SimulationResult } from './types.js';

class Lcg {
  private state: number;
  constructor(seed: number) {
    this.state = seed >>> 0;
  }
  next(): number {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 0xffffffff;
  }
}

const clamp = (n: number, low = 0, high = 1): number => Math.max(low, Math.min(high, n));

interface MutableNeighborhoodState {
  name: string;
  weatherModifier: number;
  moistureRetention: number;
  pollinators: number;
  pests: number;
  cropHealth: number;
  soilMoisture: number;
}

function evolveNeighborhood(
  n: MutableNeighborhoodState,
  config: ScenarioConfig,
  rng: Lcg
): Omit<NeighborhoodDayState, 'name'> {
  const weatherStress = clamp(0.5 + (rng.next() * 2 - 1) * config.weatherVolatility + n.weatherModifier);

  n.soilMoisture = clamp(n.soilMoisture + config.policy.wateringBudget * 0.08 * n.moistureRetention - weatherStress * 0.06);
  const pestGrowth = (0.03 + weatherStress * 0.05) * (1 - config.policy.pesticideCap * 0.7);
  const naturalPredation = (n.pollinators / 2000) * 0.2;
  n.pests = Math.max(0, n.pests * (1 + pestGrowth - naturalPredation));

  const pollGrowth =
    0.01 +
    config.policy.corridorInvestment * 0.05 +
    n.soilMoisture * 0.03 -
    weatherStress * 0.02 -
    n.pests / 5000;
  n.pollinators = Math.max(1, n.pollinators * (1 + pollGrowth));

  n.cropHealth = clamp(
    n.cropHealth + 0.02 + n.pollinators / 3000 + n.soilMoisture * 0.04 - weatherStress * 0.06 - n.pests / 4000
  );

  const resilienceScore = clamp(
    0.45 * n.cropHealth + 0.25 * clamp(n.pollinators / 300) + 0.2 * n.soilMoisture + 0.1 * (1 - clamp(n.pests / 300))
  );

  return {
    weatherStress: Number(weatherStress.toFixed(4)),
    soilMoisture: Number(n.soilMoisture.toFixed(4)),
    pollinators: Number(n.pollinators.toFixed(3)),
    pests: Number(n.pests.toFixed(3)),
    cropHealth: Number(n.cropHealth.toFixed(4)),
    resilienceScore: Number(resilienceScore.toFixed(4))
  };
}

function applyMigration(states: MutableNeighborhoodState[], migrationRate: number): void {
  if (states.length < 2 || migrationRate <= 0) return;
  const avgPollinators = states.reduce((sum, n) => sum + n.pollinators, 0) / states.length;
  const avgPests = states.reduce((sum, n) => sum + n.pests, 0) / states.length;

  for (const n of states) {
    n.pollinators = Math.max(1, n.pollinators + (avgPollinators - n.pollinators) * migrationRate);
    n.pests = Math.max(0, n.pests + (avgPests - n.pests) * migrationRate * 0.7);
  }
}

export function runSimulation(config: ScenarioConfig): SimulationResult {
  const rng = new Lcg(config.seed);

  const neighborhoods: MutableNeighborhoodState[] = config.spatial
    ? config.spatial.neighborhoods.map((n, idx) => ({
        name: n.name,
        weatherModifier: n.weatherModifier ?? 0,
        moistureRetention: n.moistureRetention ?? 1,
        pollinators: n.initialPollinators ?? config.initialPollinators,
        pests: n.initialPests ?? config.initialPests,
        cropHealth: n.initialCropHealth ?? config.initialCropHealth,
        soilMoisture: n.initialSoilMoisture ?? config.initialSoilMoisture
      }))
    : [
        {
          name: 'core',
          weatherModifier: 0,
          moistureRetention: 1,
          pollinators: config.initialPollinators,
          pests: config.initialPests,
          cropHealth: config.initialCropHealth,
          soilMoisture: config.initialSoilMoisture
        }
      ];

  const timeline: DayState[] = [];

  for (let day = 1; day <= config.days; day += 1) {
    const dailyNeighborhoods: NeighborhoodDayState[] = neighborhoods.map((n) => ({
      name: n.name,
      ...evolveNeighborhood(n, config, rng)
    }));

    if (config.spatial) {
      applyMigration(neighborhoods, config.spatial.migrationRate);
    }

    const avg = dailyNeighborhoods.reduce(
      (acc, n) => {
        acc.weatherStress += n.weatherStress;
        acc.soilMoisture += n.soilMoisture;
        acc.pollinators += n.pollinators;
        acc.pests += n.pests;
        acc.cropHealth += n.cropHealth;
        acc.resilienceScore += n.resilienceScore;
        return acc;
      },
      { weatherStress: 0, soilMoisture: 0, pollinators: 0, pests: 0, cropHealth: 0, resilienceScore: 0 }
    );

    const count = dailyNeighborhoods.length;

    timeline.push({
      day,
      weatherStress: Number((avg.weatherStress / count).toFixed(4)),
      soilMoisture: Number((avg.soilMoisture / count).toFixed(4)),
      pollinators: Number((avg.pollinators / count).toFixed(3)),
      pests: Number((avg.pests / count).toFixed(3)),
      cropHealth: Number((avg.cropHealth / count).toFixed(4)),
      resilienceScore: Number((avg.resilienceScore / count).toFixed(4)),
      neighborhoods: config.spatial ? dailyNeighborhoods : undefined
    });
  }

  const averageResilience = timeline.reduce((s, d) => s + d.resilienceScore, 0) / timeline.length;
  return {
    scenarioName: config.name,
    seed: config.seed,
    days: config.days,
    timeline,
    averageResilience: Number(averageResilience.toFixed(6)),
    spatial: config.spatial
      ? {
          neighborhoodCount: config.spatial.neighborhoods.length,
          migrationRate: config.spatial.migrationRate
        }
      : undefined
  };
}
