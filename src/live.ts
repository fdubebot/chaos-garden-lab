import { buildSimulationResult, streamSimulationDays } from './engine.js';
import type { DayState, ScenarioConfig, SimulationResult } from './types.js';

export interface LiveRunOptions {
  intervalMs?: number;
  maxDays?: number;
  onDay?: (day: DayState, timeline: DayState[]) => void;
  sleep?: (ms: number) => Promise<void>;
}

const sleepDefault = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export async function runSimulationLive(config: ScenarioConfig, options: LiveRunOptions = {}): Promise<SimulationResult> {
  const intervalMs = Math.max(0, options.intervalMs ?? 250);
  const sleep = options.sleep ?? sleepDefault;
  const timeline: DayState[] = [];

  for (const day of streamSimulationDays(config, options.maxDays ?? config.days)) {
    timeline.push(day);
    options.onDay?.(day, timeline);
    if (intervalMs > 0) {
      await sleep(intervalMs);
    }
  }

  return buildSimulationResult(config, timeline);
}

function fmt(n: number, digits = 3): string {
  return n.toFixed(digits);
}

export function renderLiveFrame(params: {
  scenarioName: string;
  totalDays: number;
  intervalMs: number;
  day: DayState;
}): string {
  const { day } = params;
  const lines: string[] = [
    `Chaos Garden Lab — LIVE`,
    `Scenario: ${params.scenarioName}`,
    `Day ${day.day}/${params.totalDays} | Tick ${params.intervalMs}ms`,
    '',
    `Resilience : ${fmt(day.resilienceScore, 4)}`,
    `Pests      : ${fmt(day.pests)}`,
    `Pollinators: ${fmt(day.pollinators)}`,
    `Crop health: ${fmt(day.cropHealth, 4)}`,
    `Soil moist.: ${fmt(day.soilMoisture, 4)}`,
    `Weather str: ${fmt(day.weatherStress, 4)}`
  ];

  if (day.neighborhoods?.length) {
    lines.push('', 'Neighborhood snapshots');
    for (const n of day.neighborhoods) {
      lines.push(
        `- ${n.name}: res=${fmt(n.resilienceScore, 4)} pests=${fmt(n.pests)} poll=${fmt(n.pollinators)} crop=${fmt(n.cropHealth, 4)}`
      );
    }
  }

  return lines.join('\n');
}
