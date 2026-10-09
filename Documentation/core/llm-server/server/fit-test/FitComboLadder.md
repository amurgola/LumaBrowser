# FitComboLadder

`core/llm-server/server/fit-test/FitComboLadder.js`

The (context, KV mode) combos a fit test measures.

## Methods

- `FitComboLadder.build(model)` returns `[{ contextTokens, kv, depthProbe? }]`:
  `ContextLadder.rungsFor(nativeContext)` crossed with `KV_VARIANTS`, context-major.
  Exactly one combo (when any qualifies) gets `depthProbe: true`.
- `FitComboLadder.nativeContext(model)` `gguf.contextLength` when the header was
  parsed, else null (full ladder).
- `FitComboLadder.pickDepthProbe(combos)` the smallest rung at or above
  `DepthProbe.MIN_CTX` with the first (highest-precision) KV mode, or null.
- `CTX_LADDER` (`ContextLadder.RUNGS`), `KV_VARIANTS` (`KvCacheModes.OFFERED_MODE_IDS`).

## Why

Rungs past the native context would be clamped by the planner and duplicate a
measurement; a model below the smallest rung still gets its native size so the
table is never empty. KV variants are mode ids because the stored row keys on
the id and a mode can be an asymmetric pair.
