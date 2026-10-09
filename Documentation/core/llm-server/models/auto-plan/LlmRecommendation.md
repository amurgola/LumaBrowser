# LlmRecommendation

`core/llm-server/models/auto-plan/LlmRecommendation.js`

Shapes a settled chat pick into the recommendation the setup run installs.

## Methods

- `LlmRecommendation.build(pick, hw)` returns
  `{ modelId, label, quant, file, url, approxBytes, contextSize, runtimeId, kvCacheType, mode, cpuMoe, rationale, predictedTps, warnId }`:
  - `file`/`url` from `CuratedModelCatalog.resolveUrl`;
  - `runtimeId` from [RecommenderRuntimePicker](../RecommenderRuntimePicker.md);
  - `mode` is the pick's mode, with `moe-cpu` reported as `gpu` and `cpuMoe: true`;
  - `predictedTps` at 8K depth or null; the rationale quotes it via `DecodeFormula.describeTps`;
  - `warnId` `cpu-only`, `partial-offload` or null.
