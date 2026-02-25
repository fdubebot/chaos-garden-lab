import { runSimulation } from './engine.js';
import type { MonteCarloSummary, ScenarioConfig } from './types.js';

const Z_SCORE_BY_CONFIDENCE: Record<number, number> = {
  0.8: 1.2816,
  0.9: 1.6449,
  0.95: 1.96,
  0.99: 2.5758
};

export function stdDev(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function zScoreForConfidence(confidenceLevel: number): number {
  const z = Z_SCORE_BY_CONFIDENCE[confidenceLevel];
  if (!z) {
    throw new Error(`Unsupported confidence level ${confidenceLevel}. Use one of: ${Object.keys(Z_SCORE_BY_CONFIDENCE).join(', ')}`);
  }
  return z;
}

export function runMonteCarlo(base: ScenarioConfig, seeds: number[], confidenceLevel = 0.95): MonteCarloSummary {
  if (seeds.length === 0) {
    throw new Error('Monte Carlo requires at least one seed');
  }

  const samples = seeds.map((seed) => {
    const result = runSimulation({ ...base, seed, name: `${base.name}-mc-${seed}` });
    const finalResilience = result.timeline[result.timeline.length - 1]?.resilienceScore ?? result.averageResilience;
    return {
      seed,
      averageResilience: result.averageResilience,
      finalResilience
    };
  });

  const values = samples.map((s) => s.averageResilience);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const sampleStdDev = stdDev(values);
  const z = zScoreForConfidence(confidenceLevel);
  const marginOfError = z * (sampleStdDev / Math.sqrt(values.length));

  return {
    scenarioName: base.name,
    runs: values.length,
    confidenceLevel,
    mean: Number(mean.toFixed(6)),
    stdDev: Number(sampleStdDev.toFixed(6)),
    marginOfError: Number(marginOfError.toFixed(6)),
    ciLow: Number((mean - marginOfError).toFixed(6)),
    ciHigh: Number((mean + marginOfError).toFixed(6)),
    samples
  };
}
