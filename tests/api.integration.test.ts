import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { startApiServer } from '../src/api.js';

describe('api mode', () => {
  it('serves health, simulation and monte-carlo endpoints', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'gardenlab-api-'));
    const dbPath = join(dir, 'api.db');
    const host = '127.0.0.1';
    const port = 8789;
    const server = await startApiServer({ host, port, dbPath });

    try {
      const health = await fetch(`http://${host}:${port}/health`).then((r) => r.json());
      expect(health.ok).toBe(true);

      const scenario = {
        name: 'api-test',
        days: 15,
        seed: 11,
        policy: { wateringBudget: 0.4, pesticideCap: 0.5, corridorInvestment: 0.4 }
      };

      const sim = await fetch(`http://${host}:${port}/simulate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scenario })
      }).then((r) => r.json());
      expect(sim.runId).toBe(1);
      expect(sim.result.averageResilience).toBeGreaterThan(0);

      const mc = await fetch(`http://${host}:${port}/monte-carlo`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scenario, runs: 4, confidenceLevel: 0.95 })
      }).then((r) => r.json());
      expect(mc.summary.runs).toBe(4);
      expect(mc.summary.ciLow).toBeLessThan(mc.summary.ciHigh);
    } finally {
      await server.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
