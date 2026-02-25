# Chaos Garden Lab

A simulation lab for testing **urban agro-ecosystem policies** under weather volatility.

Chaos Garden Lab models pollinators, pests, moisture, and crop health, supports policy sweeps, Monte Carlo confidence intervals, optional spatial neighborhoods, SQLite-backed history, and both markdown + HTML reporting.

## Quickstart

```bash
npm install
npm run build

# Single run
node dist/src/cli.js --db gardenlab.db run --scenario scenario.example.json

# Markdown report
node dist/src/cli.js --db gardenlab.db report --run-id 1 --out run-1-report.md --format md

# Rich HTML report
node dist/src/cli.js --db gardenlab.db report --run-id 1 --out run-1-report.html --format html

# Sweep and leaderboard
node dist/src/cli.js --db gardenlab.db sweep --scenario scenario.example.json
node dist/src/cli.js --db gardenlab.db leaderboard 10
```

## New capabilities

### 1) API mode

Start API server:

```bash
node dist/src/cli.js --db gardenlab.db api --host 127.0.0.1 --port 8787
```

Endpoints:
- `GET /health`
- `POST /simulate` (body: `{ "scenario": { ... } }`)
- `POST /sweep` (body can include custom policy grids)
- `POST /monte-carlo` (body: scenario + `runs`, `seedStart`, `confidenceLevel`)

Example:

```bash
curl -s http://127.0.0.1:8787/monte-carlo \
  -H 'content-type: application/json' \
  -d '{
    "scenario": { "name": "api-mc", "days": 60, "seed": 42, "policy": { "wateringBudget": 0.45, "pesticideCap": 0.5, "corridorInvestment": 0.4 } },
    "runs": 25,
    "confidenceLevel": 0.95
  }' | jq
```

### 2) Monte Carlo confidence intervals

Run Monte Carlo from CLI:

```bash
node dist/src/cli.js --db gardenlab.db monte-carlo --scenario scenario.example.json --runs 30 --confidence 0.95
```

Output includes:
- sample count
- mean resilience
- sample standard deviation
- margin of error
- confidence interval bounds (`ciLow`, `ciHigh`)

### 3) Spatial neighborhoods + migration

Scenario now supports optional `spatial` config:

```json
{
  "name": "spatial-demo",
  "days": 90,
  "seed": 42,
  "policy": { "wateringBudget": 0.5, "pesticideCap": 0.4, "corridorInvestment": 0.5 },
  "spatial": {
    "migrationRate": 0.1,
    "neighborhoods": [
      { "name": "north", "weatherModifier": -0.05, "moistureRetention": 1.1, "initialPollinators": 140 },
      { "name": "south", "weatherModifier": 0.06, "moistureRetention": 0.9, "initialPollinators": 90 }
    ]
  }
}
```

Behavior:
- per-neighborhood local dynamics each day
- migration exchange of pollinators/pests via `migrationRate`
- aggregate timeline remains available for backwards compatibility

### 4) Rich HTML visualization

`report --format html` generates a richer single-file report with:
- inline SVG resilience trend
- inline SVG pollinators vs pests trend
- scenario metric cards
- neighborhood snapshot table (if spatial data exists)

## Architecture

1. **Core Engine (`src/engine.ts`)**
   - deterministic seeded stochastic dynamics
   - single-zone and neighborhood-aware simulation modes
   - migration effects when spatial mode is enabled

2. **Config/Validation (`src/config.ts`)**
   - scenario loading + guardrails
   - spatial neighborhoods schema validation

3. **Analytics (`src/stats.ts`)**
   - Monte Carlo orchestration across seeds
   - sample standard deviation + Z-score confidence intervals

4. **Persistence (`src/persistence.ts`)**
   - SQLite schema + migrations
   - run/day storage, including optional neighborhood snapshots

5. **Reporting (`src/reporting.ts`)**
   - ASCII trend output for markdown reports
   - HTML report generation with SVG charts

6. **Automation (`src/automation.ts`)**
   - policy sweep execution + ranking

7. **CLI/API (`src/cli.ts`, `src/api.ts`)**
   - local command workflows
   - HTTP API mode for remote orchestration

## Testing

- Unit tests:
  - engine determinism + policy effects
  - spatial neighborhood outputs
  - reporting markdown + HTML render
  - Monte Carlo CI math
- Integration tests:
  - full CLI workflow including HTML + Monte Carlo
  - API mode endpoints (`/health`, `/simulate`, `/monte-carlo`)

```bash
npm run lint
npm test
npm run build
```

## Limitations

- Ecological model is synthetic and not field-calibrated
- Confidence intervals currently use normal-approximation Z-scores (fixed supported levels)
- API mode is intentionally lightweight (no auth/rate-limits built-in)

## Repository

- URL: https://github.com/fdubebot/chaos-garden-lab
- Default branch: `main`
