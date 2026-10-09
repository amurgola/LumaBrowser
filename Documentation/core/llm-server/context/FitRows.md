# FitRows

`core/llm-server/context/FitRows.js`

Lookups over a model's persisted fit-test rows
(`{ contextTokens, kv, status, tokensPerSec, vramBytes, fullOffload, tokensPerSecAtDepth, depthTokens, depthPrefillMs }`).
A row without `kv` counts as `f16`.

## Methods

- `FitRows.kvOf(row)` the row's KV mode id, `f16` when missing.
- `FitRows.okRow(rows, tokens, kv?)` the `status: 'ok'` row for that context
  and mode; with no mode, the highest precision in `KvCacheModes.MODES` order.
- `FitRows.anyRow(rows, tokens, kv?)` any row for that context (and mode).
- `FitRows.depthProbeRow(rows)` the ok row whose `tokensPerSecAtDepth` and
  `depthTokens` are both positive, highest precision first.
- `FitRows.measuredComboVram(fitEntry, tokens, kv)` the rounded `vramBytes` of
  the ok row for exactly that context and mode (`kv` defaults to `f16`), or null.
  Rows with `fullOffload: false` and non-positive samples never count; rows
  without the field (older runs) do.

## Why

`measuredComboVram` feeds the planner (`overrides.measuredVramBytes`) in place of
its header estimate, which assumes full-context KV on every layer and reads
several GB high on long-context SWA models, forcing a needless split. It is
returned raw: the sample already includes the pre-allocated KV cache and the
placement maths applies its own per-card reserve.

A partial-offload peak is only the layers that made it onto the GPU. Seeding it
as the full-offload need green-lit an ngl-999 launch that OOMed on load
(Qwen3.8-27B 256k f16: a 25.8 GB partial row "fit" a ~46 GB full offload).
