# RungEstimator

`core/llm-server/context/RungEstimator.js`

Asks the real launch planner whether a model fits at one context and KV mode,
for rungs the fit test has not measured.

## Methods

- `new RungEstimator({ planFor, catalog })`: a [PlanFor](../server/PlanFor.md)
  and an [LlmRuntimeCatalog](../runtimes/LlmRuntimeCatalog.md).
- `estimate(model, runtime, diagnostics, tokens, kv = 'f16')` plans with
  `port: 8080`, `runtimeCatalogEntry: catalog.getById(runtime.id)` and
  `overrides: { contextSize: tokens, cacheTypeK, cacheTypeV }` from
  `KvCacheModes.pair(kv)`, and returns:
  - `{ state: 'ok', vramBytes: modelEstimatedBytes, usableVramBytes: vramAvailableBytes, decode }` on full offload;
  - `{ state: 'partial', vramBytes: null, ngl, layerCount, perLayerBytes, decode }` when `partial.ngl > 0`;
  - `{ state: 'no', vramBytes: null, layerCount, perLayerBytes, decode }` otherwise;
  - `{ state: 'unknown', vramBytes: null }` with no runtime `binaryPath` or when anything throws.
  `decode` is the plan's `decodeEstimate` or null.
- `predictedTpsAtDepth(model, runtime, diagnostics, depthTokens, kv)` the
  prediction from a plan sized to the probe's depth, or null.
- `RungEstimator.predictedTps(estimate)` `decode.atFull` when positive, else null.
- `RungEstimator.ESTIMATE_PORT` 8080 (nothing is spawned).

## Why

The mode id is expanded to a (K, V) pair: passed through as a precision, an
asymmetric mode would be normalised to f16 by the planner, an estimate for a
launch nobody runs. PlanFor routes MLX and extension runtimes to their own
planners (bug H12).
