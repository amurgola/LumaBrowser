# FullOffloadCost

`core/llm-server/server/launch/FullOffloadCost.js`

Prices the GPU memory a launch needs with every layer offloaded.

## Methods

- `FullOffloadCost.bytes({ modelBytes, mmprojBytes, gguf, contextSize, cacheTypeK, cacheTypeV, mtpEnabled, mtpHeadBytes = 0, drafterBytes = 0, flashAttnSupported, kvOnHost, swaFull, draftCacheType = null, microBatch })`
  returns `round(weights + projector + KV + fixed overhead + context scratch + masks + draft branch)`.
  `modelBytes` is what sits on the GPU: the caller leaves host-only tensors out
  ([MoeExpertPlan](MoeExpertPlan.md)`._hostInputBytes`). The context scratch is
  [ContextScratchCost](ContextScratchCost.md)`.bytes` for one card, left out
  with `scratchHeldBack: true` (an expert offload, which holds its own compute
  room back).
  KV is [KvCacheSizer](KvCacheSizer.md)`.total` (0 with `kvOnHost`); the masks
  are [LayerMaskCost](LayerMaskCost.md)`.bytes` at `microBatch` (llama.cpp's
  512 when left out), 0 for every architecture but those that keep an
  attention mask per block pass, and priced whether or not the KV is on the
  host; the draft
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

## draftBranchBytes (2026-11-20)

`FullOffloadCost.draftBranchBytes(input)` is the draft branch term on its own
(0 without one), public so [SplitPlan](SplitPlan.md) can charge all of it to
the card that holds the output layer.
