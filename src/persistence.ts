import Database from 'better-sqlite3';
import type { SimulationResult } from './types.js';

export function initDb(dbPath: string): Database.Database {
  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scenario_name TEXT NOT NULL,
      seed INTEGER NOT NULL,
      days INTEGER NOT NULL,
      average_resilience REAL NOT NULL,
      final_resilience REAL NOT NULL,
      metadata_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS daily_states (
      run_id INTEGER NOT NULL,
      day INTEGER NOT NULL,
      weather_stress REAL NOT NULL,
      soil_moisture REAL NOT NULL,
      pollinators REAL NOT NULL,
      pests REAL NOT NULL,
      crop_health REAL NOT NULL,
      resilience_score REAL NOT NULL,
      PRIMARY KEY (run_id, day)
    );
  `);
  return db;
}

export function saveResult(db: Database.Database, result: SimulationResult, metadata: Record<string, unknown> = {}): number {
  const runStmt = db.prepare(`
    INSERT INTO runs (scenario_name, seed, days, average_resilience, final_resilience, metadata_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const runInfo = runStmt.run(
    result.scenarioName,
    result.seed,
    result.days,
    result.averageResilience,
    result.timeline[result.timeline.length - 1].resilienceScore,
    JSON.stringify(metadata)
  );

  const runId = Number(runInfo.lastInsertRowid);
  const dayStmt = db.prepare(`
    INSERT INTO daily_states (run_id, day, weather_stress, soil_moisture, pollinators, pests, crop_health, resilience_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction(() => {
    for (const day of result.timeline) {
      dayStmt.run(
        runId,
        day.day,
        day.weatherStress,
        day.soilMoisture,
        day.pollinators,
        day.pests,
        day.cropHealth,
        day.resilienceScore
      );
    }
  });
  insertMany();

  return runId;
}

export function getRun(db: Database.Database, runId: number): { run: any; days: any[] } {
  const run = db.prepare('SELECT * FROM runs WHERE id = ?').get(runId);
  if (!run) throw new Error(`run ${runId} not found`);
  const days = db.prepare('SELECT * FROM daily_states WHERE run_id = ? ORDER BY day').all(runId);
  return { run, days };
}

export function topRuns(db: Database.Database, limit = 5): any[] {
  return db
    .prepare(
      `SELECT id, scenario_name, average_resilience, final_resilience, created_at
       FROM runs ORDER BY average_resilience DESC, final_resilience DESC LIMIT ?`
    )
    .all(limit);
}
