# Chaos Garden Lab

A novel simulation lab for testing **urban agro-ecosystem policies** under weather volatility.

Chaos Garden Lab models the interaction of pollinators, pests, moisture, and crop health, then lets you run automated policy sweeps and generate historical reports from SQLite-backed runs.

## Quickstart

```bash
npm install
npm run build

# Single run
node dist/cli.js --db gardenlab.db run --scenario scenario.example.json

# Generate report for run 1
node dist/cli.js --db gardenlab.db report --run-id 1 --out run-1-report.md

# Sweep and leaderboard
node dist/cli.js --db gardenlab.db sweep --scenario scenario.example.json
node dist/cli.js --db gardenlab.db leaderboard 10
```

## Real examples

Run a scenario:
```bash
node dist/cli.js --db gardenlab.db run --scenario scenario.example.json
# Run completed: run_id=1 avg_resilience=0.8012
```

Generate report:
```bash
node dist/cli.js --db gardenlab.db report --run-id 1 --out report.md
cat report.md
```

## Architecture

1. **Core Engine (`src/engine.ts`)**
   - deterministic seeded stochastic dynamics
   - daily update loop + resilience scoring

2. **Config/Validation (`src/config.ts`)**
   - scenario loading and constraints

3. **Persistence (`src/persistence.ts`)**
   - SQLite schema and run/day storage
   - run retrieval + top-run ranking

4. **Reporting/Visualization (`src/reporting.ts`)**
   - ASCII sparkline-style trend rendering
   - markdown run reports and sweep summaries

5. **Automation (`src/automation.ts`)**
   - policy grid sweep execution and ranking

6. **CLI (`src/cli.ts`)**
   - end-to-end commands: run, sweep, report, leaderboard

## Testing

- Unit tests:
  - engine determinism and policy effect
  - reporting trend output
- Integration/E2E:
  - full flow run -> report -> leaderboard

```bash
npm run lint
npm test
npm run build
```

## Limitations

- Ecological model is synthetic and not field-calibrated
- Single-zone model (no spatial neighborhoods)
- CLI argument parser is intentionally lightweight
- Visualization is text-first (no interactive charts yet)

## Next steps

- Add API mode for remote simulation orchestration
- Add Monte Carlo confidence intervals over multiple seeds
- Add spatial neighborhoods and migration effects
- Add HTML report output with richer charts
