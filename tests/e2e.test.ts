import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { cli } from '../src/cli.js';

describe('e2e workflow', () => {
  it('runs full flow: run -> report -> leaderboard', () => {
    const dir = mkdtempSync(join(tmpdir(), 'gardenlab-'));
    try {
      const db = join(dir, 'lab.db');
      const scenario = join(dir, 'scenario.json');
      const report = join(dir, 'report.md');
      writeFileSync(
        scenario,
        JSON.stringify({
          name: 'integration',
          days: 20,
          seed: 8,
          policy: { wateringBudget: 0.5, pesticideCap: 0.4, corridorInvestment: 0.5 }
        })
      );

      expect(cli(['--db', db, 'run', '--scenario', scenario])).toBe(0);
      expect(cli(['--db', db, 'report', '--run-id', '1', '--out', report])).toBe(0);
      expect(readFileSync(report, 'utf-8')).toContain('Chaos Garden Report');
      expect(cli(['--db', db, 'leaderboard', '5'])).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
