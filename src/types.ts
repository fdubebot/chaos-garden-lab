export interface InterventionPolicy {
  wateringBudget: number;
  pesticideCap: number;
  corridorInvestment: number;
}

export interface NeighborhoodConfig {
  name: string;
  weatherModifier?: number;
  moistureRetention?: number;
  initialPollinators?: number;
  initialPests?: number;
  initialCropHealth?: number;
  initialSoilMoisture?: number;
}

export interface SpatialConfig {
  migrationRate: number;
  neighborhoods: NeighborhoodConfig[];
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
  spatial?: SpatialConfig;
}

export interface NeighborhoodDayState {
  name: string;
  weatherStress: number;
  soilMoisture: number;
  pollinators: number;
  pests: number;
  cropHealth: number;
  resilienceScore: number;
}

export interface DayState {
  day: number;
  weatherStress: number;
  soilMoisture: number;
  pollinators: number;
  pests: number;
  cropHealth: number;
  resilienceScore: number;
  neighborhoods?: NeighborhoodDayState[];
}

export interface SimulationResult {
  scenarioName: string;
  seed: number;
  days: number;
  timeline: DayState[];
  averageResilience: number;
  spatial?: {
    neighborhoodCount: number;
    migrationRate: number;
  };
}

export interface MonteCarloRunSummary {
  seed: number;
  averageResilience: number;
  finalResilience: number;
}

export interface MonteCarloSummary {
  scenarioName: string;
  runs: number;
  confidenceLevel: number;
  mean: number;
  stdDev: number;
  marginOfError: number;
  ciLow: number;
  ciHigh: number;
  samples: MonteCarloRunSummary[];
}
