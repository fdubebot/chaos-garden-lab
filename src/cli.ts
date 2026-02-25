#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { loadScenario } from './config.js';
import { runSimulation } from './engine.js';
import { runPolicySweep } from './automation.js';
import { buildRunReport, buildSweepSummary } from './reporting.js';
import { getRun, initDb, saveResult, topRuns } from './persistence.js';

export function cli(argv: string[]): number {
  const args = [...argv];
  let dbPath = 'gardenlab.db';

  if (args[0] === '--db') {
    dbPath = args[1];
    args.splice(0, 2);
  }

  const cmd = args[0];
  const db = initDb(dbPath);

  if (cmd === 'run') {
    const scenarioPath = args[2];
    const result = runSimulation(loadScenario(scenarioPath));
    const runId = saveResult(db, result, { mode: 'single' });
    console.log(`Run completed: run_id=${runId} avg_resilience=${result.averageResilience.toFixed(4)}`);
    db.close();
    return 0;
  }

  if (cmd === 'sweep') {
    const scenarioPath = args[2];
    const resultSet = runPolicySweep(loadScenario(scenarioPath), [0.2, 0.5, 0.8], [0.2, 0.5], [0.3, 0.7]);
    let rank = 0;
    for (const result of resultSet) {
      rank += 1;
      const runId = saveResult(db, result, { mode: 'sweep', rank });
      console.log(`Saved run_id=${runId} scenario=${result.scenarioName} avg_resilience=${result.averageResilience.toFixed(4)}`);
    }
    console.log(`Sweep completed: ${resultSet.length} runs`);
    db.close();
    return 0;
  }

  if (cmd === 'report') {
    const runId = Number(args[2]);
    const out = args[4];
    const report = buildRunReport(getRun(db, runId));
    writeFileSync(out, report);
    console.log(`Report written to ${out}`);
    db.close();
    return 0;
  }

  if (cmd === 'leaderboard') {
    console.log(buildSweepSummary(topRuns(db, Number(args[2] ?? 5))));
    db.close();
    return 0;
  }

  console.log('Usage: gardenlab [--db file] run --scenario file | sweep --scenario file | report --run-id N --out file | leaderboard [limit]');
  db.close();
  return 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(cli(process.argv.slice(2)));
}
