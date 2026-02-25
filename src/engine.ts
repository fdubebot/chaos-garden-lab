import type { DayState, ScenarioConfig, SimulationResult } from './types.js';

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

export function runSimulation(config: ScenarioConfig): SimulationResult {
  const rng = new Lcg(config.seed);
  let pollinators = config.initialPollinators;
  let pests = config.initialPests;
  let cropHealth = config.initialCropHealth;
  let soilMoisture = config.initialSoilMoisture;

  const timeline: DayState[] = [];

  for (let day = 1; day <= config.days; day += 1) {
    const weatherStress = clamp(0.5 + (rng.next() * 2 - 1) * config.weatherVolatility);

    soilMoisture = clamp(soilMoisture + config.policy.wateringBudget * 0.08 - weatherStress * 0.06);
    const pestGrowth = (0.03 + weatherStress * 0.05) * (1 - config.policy.pesticideCap * 0.7);
    const naturalPredation = (pollinators / 2000) * 0.2;
    pests = Math.max(0, pests * (1 + pestGrowth - naturalPredation));

    const pollGrowth =
      0.01 +
      config.policy.corridorInvestment * 0.05 +
      soilMoisture * 0.03 -
      weatherStress * 0.02 -
      pests / 5000;
    pollinators = Math.max(1, pollinators * (1 + pollGrowth));

    cropHealth = clamp(
      cropHealth +
        0.02 +
        pollinators / 3000 +
        soilMoisture * 0.04 -
        weatherStress * 0.06 -
        pests / 4000
    );

    const resilienceScore = clamp(
      0.45 * cropHealth +
        0.25 * clamp(pollinators / 300) +
        0.2 * soilMoisture +
        0.1 * (1 - clamp(pests / 300))
    );

    timeline.push({
      day,
      weatherStress: Number(weatherStress.toFixed(4)),
      soilMoisture: Number(soilMoisture.toFixed(4)),
      pollinators: Number(pollinators.toFixed(3)),
      pests: Number(pests.toFixed(3)),
      cropHealth: Number(cropHealth.toFixed(4)),
      resilienceScore: Number(resilienceScore.toFixed(4))
    });
  }

  const averageResilience = timeline.reduce((s, d) => s + d.resilienceScore, 0) / timeline.length;
  return {
    scenarioName: config.name,
    seed: config.seed,
    days: config.days,
    timeline,
    averageResilience: Number(averageResilience.toFixed(6))
  };
}
