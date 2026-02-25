#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { loadScenario } from './config.js';
import { runSimulation } from './engine.js';
import { runPolicySweep } from './automation.js';
import { buildRunHtmlReport, buildRunReport, buildSweepSummary } from './reporting.js';
import { getRun, initDb, saveResult, topRuns } from './persistence.js';
import { runMonteCarlo } from './stats.js';
import { startApiServer } from './api.js';

function getFlag(args: string[], flag: string, fallback?: string): string | undefined {
  const i = args.indexOf(flag);
  if (i < 0) return fallback;
  return args[i + 1];
}

export function cli(argv: string[]): number {
  const args = [...argv];
  let dbPath = 'gardenlab.db';

  if (args[0] === '--db') {
    dbPath = args[1];
    args.splice(0, 2);
  }

  const cmd = args[0];

  if (cmd === 'api') {
    const host = getFlag(args, '--host', '127.0.0.1') as string;
    const port = Number(getFlag(args, '--port', '8787'));
    startApiServer({ host, port, dbPath })
      .then(() => {
        console.log(`API server listening on http://${host}:${port}`);
      })
      .catch((err) => {
        console.error(`Failed to start API server: ${String(err?.message ?? err)}`);
        process.exitCode = 1;
      });
    return 0;
  }

  const db = initDb(dbPath);

  if (cmd === 'run') {
    const scenarioPath = getFlag(args, '--scenario');
    if (!scenarioPath) throw new Error('run requires --scenario');
    const result = runSimulation(loadScenario(scenarioPath));
    const runId = saveResult(db, result, { mode: 'single' });
    console.log(`Run completed: run_id=${runId} avg_resilience=${result.averageResilience.toFixed(4)}`);
    db.close();
    return 0;
  }

  if (cmd === 'sweep') {
    const scenarioPath = getFlag(args, '--scenario');
    if (!scenarioPath) throw new Error('sweep requires --scenario');
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

  if (cmd === 'monte-carlo') {
    const scenarioPath = getFlag(args, '--scenario');
    const runs = Number(getFlag(args, '--runs', '20'));
    const confidenceLevel = Number(getFlag(args, '--confidence', '0.95'));
    if (!scenarioPath) throw new Error('monte-carlo requires --scenario');
    const base = loadScenario(scenarioPath);
    const seeds = Array.from({ length: runs }, (_, i) => base.seed + i);
    const summary = runMonteCarlo(base, seeds, confidenceLevel);
    console.log(JSON.stringify(summary, null, 2));
    db.close();
    return 0;
  }

  if (cmd === 'report') {
    const runId = Number(getFlag(args, '--run-id'));
    const out = getFlag(args, '--out');
    const format = (getFlag(args, '--format', out?.endsWith('.html') ? 'html' : 'md') as string).toLowerCase();
    if (!runId || !out) throw new Error('report requires --run-id and --out');
    const payload = getRun(db, runId);
    const report = format === 'html' ? buildRunHtmlReport(payload) : buildRunReport(payload);
    writeFileSync(out, report);
    console.log(`Report written to ${out}`);
    db.close();
    return 0;
  }

  if (cmd === 'leaderboard') {
    console.log(buildSweepSummary(topRuns(db, Number(args[1] ?? 5))));
    db.close();
    return 0;
  }

  console.log(
    'Usage: gardenlab [--db file] run --scenario file | sweep --scenario file | monte-carlo --scenario file [--runs N --confidence 0.95] | report --run-id N --out file [--format md|html] | leaderboard [limit] | api [--host 127.0.0.1 --port 8787]'
  );
  db.close();
  return 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(cli(process.argv.slice(2)));
}
