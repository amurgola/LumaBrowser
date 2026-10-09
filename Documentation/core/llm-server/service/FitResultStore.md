# FitResultStore

`core/llm-server/service/FitResultStore.js`

Persisted fit-test results per model weights path. Extends [ModelResultStore](ModelResultStore.md).

## Methods

- `new FitResultStore(settingsDb)`; `all()`, `get(modelPath)`, `save(modelPath, entry)`.
- Kept only when `entry.results` is a non-empty array. Stored as
  `{ runtime (or null), results, hardware (or null), ranAt (default now), canceled (boolean) }`;
  a cancelled run with partial rows is kept, flagged.
- `STORAGE_KEY` `core.llmServer.fitResults`.

## Why

[FitTester](../server/FitTester.md) measurements cost minutes of real model
loads; the picker's [ContextEstimator](../ContextEstimator.md) and the launcher's
measured-fit overrides read them back after a reload or restart.
