# FullOffloadCost

`core/llm-server/server/launch/FullOffloadCost.js`

Prices the GPU memory a launch needs with every layer offloaded.

## Methods

- `FullOffloadCost.bytes({ modelBytes, mmprojBytes, gguf, contextSize, cacheTypeK, cacheTypeV, mtpEnabled, mtpHeadBytes = 0, drafterBytes = 0, flashAttnSupported, kvOnHost, swaFull, draftCacheType = null })`
  returns `round(weights + projector + KV + fixed overhead + draft branch)`.
  KV is [KvCacheSizer](KvCacheSizer.md)`.total` (0 with `kvOnHost`); the draft
  branch is [DraftBranchCost](DraftBranchCost.md) when MTP runs or a drafter
  loads, with the draft KV priced at `draftCacheType` when set.
- `FullOffloadCost.noHeaderBytes({ modelBytes, mmprojBytes, drafterBytes, mtpBranchBytes })`
  returns `round(sum x 1.2)`, the estimate when the header was unreadable.

## Why

The fit decision used to be a 1.2x weight heuristic that double-counted at short
contexts and under-counted at long ones; with a header the planner sums the real
components. The no-header fallback prices the model's own projector whether or
not the launch loads it (legacy behaviour, kept).

## Hybrid targets

`bytes` also takes `draftN` (tokens drafted per step). `recurrentLayers(gguf)` is
`blockCount - attnKvLayerCount` when the tensor scan counted fewer KV layers than
blocks (Qwen3.8-27B: 48 of 65), else 0; the draft branch prices one recurrent-state
checkpoint per drafted token per such layer (2.8 MiB each, measured 2026-11-08).
