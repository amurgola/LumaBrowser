# SlotPlan

`core/llm-server/server/launch/SlotPlan.js`

The serving-slot settings of one launch.

## Methods

- `SlotPlan.resolve({ overrides, flags })` returns `{ requestedConcurrent, parallelEnabled, maxConcurrent, cacheReuseRequested, cacheReuseEnabled }`.
  `requestedConcurrent` is the floored `overrides.maxConcurrent` (1 when below 1
  or junk); `maxConcurrent` is what the server decodes with (1 without
  `--parallel` support).
- `CACHE_REUSE_MIN_CHUNK` (256).

## Why

`maxConcurrent`, not the request, is what the LLM queue gate mirrors, so callers
never fire more requests than the server has slots. `--cache-reuse 256` reuses KV
chunks after a prompt diverges and re-converges (history compaction, an edited
turn); 256 is big enough that shifting beats recomputing and small enough to
catch paragraph-sized survivals. It is opt-in because KV shifting is not
implemented for every architecture (mrope models reject it).
