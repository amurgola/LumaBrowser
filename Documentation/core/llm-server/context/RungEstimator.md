# RungEstimator

`core/llm-server/context/RungEstimator.js`

Asks the real launch planner what a Start would decide for a model at one context and
KV mode: the estimate for rungs the fit test has not measured, and the check a measured
rung gets against today's free VRAM.

## Methods

- `new RungEstimator({ planFor, catalog, preview })`: a [PlanFor](../server/PlanFor.md),
  an [LlmRuntimeCatalog](../runtimes/LlmRuntimeCatalog.md) and a preview with
  `plan({ model, runtime, diagnostics, settingsDb, overrides })` (default a
  [StartPlanPreview](../server/launcher/StartPlanPreview.md) over the two).
- `estimate(model, runtime, diagnostics, tokens, kv = 'f16', { settingsDb, measured })`
  asks the preview for the plan a Start would make (a probe plan on every card, the
  launcher's card pick with nothing claimed, then the plan on the picked cards). Plans use
  `overrides: { contextSize: tokens,
  cacheTypeK, cacheTypeV, suppressMmprojLoad: true }` from `KvCacheModes.pair(kv)`, plus
  `measuredVramBytes` and `measuredFullOffload` when `measured.vramBytes` is positive. Returns:
  - `{ state: 'ok', vramBytes: modelEstimatedBytes, usableVramBytes, softHeadroom, cards, decode }`
    on full offload: `usableVramBytes` is the plan's `fullOffloadRoomBytes` (else
    `vramAvailableBytes`), `cards` the names of the split's cards holding layers, else
    every card the plan saw;
  - `{ state: 'partial', vramBytes: null, ngl, layerCount, perLayerBytes, decode }` when `partial.ngl > 0`;
  - `{ state: 'no', vramBytes: null, layerCount, perLayerBytes, decode }` otherwise;
  - `{ state: 'unknown', vramBytes: null }` with no runtime `binaryPath` or when anything throws.
  `decode` is the plan's `decodeEstimate` or null.
- `predictedTpsAtDepth(model, runtime, diagnostics, depthTokens, kv, options)` the
  prediction from a plan sized to the probe's depth, or null.
- `RungEstimator.predictedTps(estimate)` `decode.atFull` when positive, else null.
- `RungEstimator.ESTIMATE_PORT` 8080 (nothing is spawned).

## Why

The mode id is expanded to a (K, V) pair: passed through as a precision, an
asymmetric mode would be normalised to f16 by the planner, an estimate for a
launch nobody runs. PlanFor routes MLX and extension runtimes to their own
planners (bug H12). The card pick is mirrored because planning from the persisted
snapshot's totals, with no live occupancy and no pick, said "fits" where Start split
the model over two cards. The projector is left out because a chat Start is text-only
(it loads for a turn that carries an image), and a fit test's measured peak is trusted
over the header, as Start does.

## Measured shape (2026-11-20)

A `measured` row is passed as `{ vramBytes, fullOffload, shape }` and
`_overrides` hands the planner `measuredShape` (null for a shapeless row), so
a rung's fit-test peak is judged the way a Start judges it: trusted only when
it was measured under today's launch shape
([FitShape](../server/launch/FitShape.md)).
