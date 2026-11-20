# GambitResultStore

`extensions/model-testing/gambit/GambitResultStore.js`

Persisted compatibility-gambit reports per model weights path, owned by
[CompatibilityGambit](CompatibilityGambit.md). Extends the core
[ModelResultStore](../../../core/llm-server/service/ModelResultStore.md), loaded through
[CoreRequire](../CoreRequire.md), over the LLM service's settings database.

## Methods

- `new GambitResultStore(settingsDb)`; `all()`, `get(modelPath)`, `save(modelPath, entry)`.
- Kept only when `entry.report.coverage.ran` is present and not 0. Stored as
  `{ report (without raw), ranAt (default now), canceled (boolean) }`.
- `STORAGE_KEY` `core.llmServer.gambitResults`: the key from when the store lived in core, kept so every
  grade saved before the move still shows.

## Why

A gambit run costs 30 to 60 minutes of model turns. The raw per-task transcripts
are megabytes and are handed to the renderer for download instead, so `raw` is
stripped even if a caller passes it.
