export interface InterventionPolicy {
  wateringBudget: number;
  pesticideCap: number;
  corridorInvestment: number;
}

export interface ScenarioConfig {
  name: string;
  days: number;
  seed: number;
  initialPollinators: number;
  initialPests: number;
  initialCropHealth: number;
  initialSoilMoisture: number;
  weatherVolatility: number;
  policy: InterventionPolicy;
}

export interface DayState {
  day: number;
  weatherStress: number;
  soilMoisture: number;
  pollinators: number;
  pests: number;
  cropHealth: number;
  resilienceScore: number;
}

export interface SimulationResult {
  scenarioName: string;
  seed: number;
  days: number;
  timeline: DayState[];
  averageResilience: number;
}
