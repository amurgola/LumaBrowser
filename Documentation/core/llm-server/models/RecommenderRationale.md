# RecommenderRationale

`core/llm-server/models/RecommenderRationale.js`

Writes the explanation the onboarding wizard shows under its recommendation.

## Methods

- `RecommenderRationale.build({ useCase, model, quant, mode, usableVram, ctx, ctxPref, kvCacheType, tkPref, speed, predictedTps })`
  returns: `For <use case>, <label> (<quant>) is the most capable model that runs
  <where>. Context set to <ctx> tokens for your "<pref>" preference[, with a
  compressed KV cache to fit VRAM]. You said ~<tk> tok/s is the slowest you'd
  accept, <speed clause>[ Predicted about N tok/s on this machine.]`
- `RecommenderRationale.gb(bytes)`: `N GB`, 0 decimals at 10 or more, else 1;
  invalid input reads as 0.
- `USE_CASE_LABELS`, `SPEED_CLAUSES`, `GB`.

## Why

The wizard explains its pick so the user can see which answer drove it. `gb`
mirrors the renderer's `LumaFmt.gb` (card-label precision), which this main-process
class cannot require.
