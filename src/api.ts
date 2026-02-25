import { createServer } from 'node:http';
import { parseScenario } from './config.js';
import { runSimulation } from './engine.js';
import { runPolicySweep } from './automation.js';
import { initDb, saveResult } from './persistence.js';
import { runMonteCarlo } from './stats.js';

interface ApiOptions {
  host: string;
  port: number;
  dbPath: string;
}

function send(res: any, code: number, body: unknown): void {
  res.writeHead(code, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readJson(req: any): Promise<any> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf-8');
  return raw ? JSON.parse(raw) : {};
}

export function startApiServer(options: ApiOptions): Promise<{ close: () => Promise<void> }> {
  const db = initDb(options.dbPath);
  const server = createServer(async (req, res) => {
    try {
      const method = req.method ?? 'GET';
      const path = req.url ?? '/';

      if (method === 'GET' && path === '/health') {
        send(res, 200, { ok: true });
        return;
      }

      if (method === 'POST' && path === '/simulate') {
        const body = await readJson(req);
        const scenario = parseScenario(body.scenario ?? body);
        const result = runSimulation(scenario);
        const runId = saveResult(db, result, { mode: 'api/simulate' });
        send(res, 200, { runId, result });
        return;
      }

      if (method === 'POST' && path === '/sweep') {
        const body = await readJson(req);
        const scenario = parseScenario(body.scenario ?? body);
        const watering = body.wateringLevels ?? [0.2, 0.5, 0.8];
        const pesticides = body.pesticideCaps ?? [0.2, 0.5];
        const corridors = body.corridorLevels ?? [0.3, 0.7];
        const results = runPolicySweep(scenario, watering, pesticides, corridors);
        const runIds: number[] = [];
        let rank = 0;
        for (const result of results) {
          rank += 1;
          runIds.push(saveResult(db, result, { mode: 'api/sweep', rank }));
        }
        send(res, 200, { runIds, count: results.length, topAverageResilience: results[0]?.averageResilience ?? null });
        return;
      }

      if (method === 'POST' && path === '/monte-carlo') {
        const body = await readJson(req);
        const scenario = parseScenario(body.scenario ?? body);
        const seedStart = Number(body.seedStart ?? scenario.seed);
        const runs = Number(body.runs ?? 20);
        const seeds = Array.from({ length: runs }, (_, i) => seedStart + i);
        const confidenceLevel = Number(body.confidenceLevel ?? 0.95);
        const summary = runMonteCarlo(scenario, seeds, confidenceLevel);
        send(res, 200, { summary });
        return;
      }

      send(res, 404, { error: 'not found' });
    } catch (error: any) {
      send(res, 400, { error: error?.message ?? 'request failed' });
    }
  });

  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(options.port, options.host, () => {
      resolve({
        close: async () => {
          await new Promise<void>((resolveClose, rejectClose) => {
            server.close((err) => (err ? rejectClose(err) : resolveClose()));
          });
          db.close();
        }
      });
    });
  });
}
