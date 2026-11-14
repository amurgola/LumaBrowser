# LlmRecommendation

`core/llm-server/models/auto-plan/LlmRecommendation.js`

Shapes a settled chat pick into the recommendation the setup run installs.

## Methods

- `LlmRecommendation.build(pick, hw)` returns
  `{ modelId, label, quant, file, url, approxBytes, vramNeedBytes, contextSize, runtimeId, kvCacheType, mode, cpuMoe, rationale, predictedTps, warnId }`:
  - `file`/`url` from `CuratedModelCatalog.resolveUrl`;
  - `vramNeedBytes` is the VRAM the plan budgets for the pick (`AutoPlanRanking.vramNeedOf`), null for a CPU or
    partial pick; the placement canvas's example PC preview draws it;
  - `runtimeId` from [RecommenderRuntimePicker](../RecommenderRuntimePicker.md);
  - `mode` is the pick's mode, with `moe-cpu` reported as `gpu` and `cpuMoe: true`;
  - `predictedTps` at 8K depth or null; the rationale quotes it via `DecodeFormula.describeTps`;
  - `warnId` `cpu-only`, `partial-offload` or null.
