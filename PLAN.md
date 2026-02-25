# PLAN — Chaos Garden Lab (TypeScript)

## Concept
Chaos Garden Lab is a **policy experimentation simulator** for urban food micro-ecosystems. It simulates crop resilience under volatile weather and intervention levers (watering, pesticide strictness, pollinator corridors), then automates scenario sweeps and generates reports from persisted run history.

### Why this is novel
This project combines a stochastic ecosystem simulator with experiment automation and historical analytics in a way that feels like a mini decision lab rather than a one-off script.

## Architecture

1. **Core Engine** (`src/engine.ts`)
   - deterministic, seedable stochastic simulation
   - coupled dynamics: weather stress, moisture, pests, pollinators, crop health
   - per-day timeline + aggregate metrics

2. **Config + Validation** (`src/config.ts`)
   - scenario schema parser/validator
   - defaults + guardrails for parameter bounds

3. **Persistence** (`src/persistence.ts`)
   - SQLite storage for runs and daily states
   - retrieval + leaderboard queries

4. **Reporting / Visualization** (`src/reporting.ts`)
   - ASCII sparkline rendering
   - markdown run reports and sweep summaries

5. **Automation** (`src/automation.ts`)
   - policy grid sweep engine
   - ranking by resilience outcomes

6. **CLI** (`src/cli.ts`)
   - runnable end-to-end workflow: `run`, `sweep`, `report`, `leaderboard`

## Milestones
1. Initialize new repository and TS toolchain
2. Implement config + engine + persistence modules
3. Implement reporting + automation + CLI orchestration
4. Add tests:
   - unit tests for core engine/reporting logic
   - integration/e2e test covering full CLI flow
5. Write README (quickstart, architecture, examples, limits/next steps)
6. Run lint/test/build and ensure all pass
7. Commit and push to GitHub main
