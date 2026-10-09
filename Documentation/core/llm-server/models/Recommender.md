# Recommender

`core/llm-server/models/Recommender.js`

The onboarding recommender: hardware budget plus three wizard answers to one
curated model, quant, context, KV precision and runtime, before anything is
downloaded.

## Methods

- `Recommender.recommend(hw, answers)` returns
  `{ modelId, label, quant, file, url, approxBytes, contextSize, runtimeId, kvCacheType, mode, rationale, predictedTps, warnId }`.
  - `hw`: a [HwBudget](HwBudget.md) result plus `cudaAvailable`, `cudaVersion`.
  - `answers`: `{ useCase: 'chat'|'development'|'documents', tkPref, ctxPref: 'short'|'medium'|'long' }`;
    defaults chat, 20, medium.
  - `mode`: `gpu`, `partial` or `cpu`; `warnId`: `null`, `partial-offload`, `cpu-only`.
- `CTX_TARGET` (`short` 4096, `medium` 16384, `long` 49152), `KV_RESERVE_CTX`
  (32768), `MIN_CONTEXT` (4096), `MIN_GPU_BYTES` (1.5 GiB), `FALLBACK_RAM_BYTES` (8 GiB).

## Steps

1. Pool: [CuratedModelCatalog](CuratedModelCatalog.md) models for the use case (all
   if none), most parameters first; for development a coder model leads.
2. Pick, first that applies:
   - on a GPU, the first model with a quant whose weights + 32K q8 KV + 1 GiB fit
     VRAM (highest such quant) and whose predicted speed clears `tkPref`; if none
     clears it, the first that fit;
   - unless `tkPref >= 50`, the first model whose Q4_K_M fits RAM (all of it when
     patient, 75% when balanced), as `partial` on a GPU or `cpu`;
   - the smallest catalog model at Q4_K_M.
3. Context: the preference clamped to the model max; on a `gpu` pick, KV shrinks to
   q8 before the context halves, down to 4096.
4. Rationale from [RecommenderRationale](RecommenderRationale.md), runtime from
   [RecommenderRuntimePicker](RecommenderRuntimePicker.md), speed from
   [CatalogDecodeEstimator](../server/decode/CatalogDecodeEstimator.md).

## Why

The wizard has to recommend instantly, so only pre-download facts are used and
estimates bias conservative; the fit tester stays the accurate tool. VRAM is
reserved for a working session (32K q8 KV), not the catalog's 8K `minVramBytes`,
so a pick that fits at idle does not OOM as the conversation grows. The context
budget uses raw weights + overhead + the KV being sized; using `minVramBytes` there
double-counted and collapsed every pick to 4K.
