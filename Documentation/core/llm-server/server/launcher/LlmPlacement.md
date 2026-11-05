# LlmPlacement

`core/llm-server/server/launcher/LlmPlacement.js`

Picks the GPU(s) for a local start before the real plan.

## Methods

- `new LlmPlacement({ vram })` (a `VramCoordinator`).
- `place(ctx)` plans a probe, reserves `{ serverId: 'llm', role: 'llm', allowSplit: true }`
  for `placementNeed(ctx, probe.plan)`, and sets `ctx.cudaDevice`, `ctx.tensorSplit` (the
  reservation's `split`) and `ctx.planDiag` (diagnostics narrowed to the reserved
  cards). A user-drawn split over 2+ cards sets `overrides.manualTensorSplitActive`.
  Any failure leaves the start unpinned.
- `placeForRescue(ctx, headerEstimatedBytes)` reserves again for the header
  estimate and returns `{ cudaDevice, diagnostics }`.
- `LlmPlacement.placementNeed(ctx, plan)`: the probe plan's `moeCacheSingleCardBytes` when it is
  set and the local cards are of mixed models (two or more, names differ); else
  `modelEstimatedBytes`; undefined without a plan.
- `LlmPlacement.requestedBytes(ctx, need)`: undefined for no need; the whole need
  without peers; with `overrides.rpcServers`, capped at the summed local room
  (free, else total, minus `CudaDevicePicker.PER_CARD_RESERVE_BYTES` per card), at
  least 1, or undefined when there is no local reading.

## Why

A probe plan whose MoE GPU cache spans the box prices a cache for every card, so no single
card ever fits and a cached launch always spreads. Measured 2026-11-02 (Qwen3.8-Flash-Next
UD-Q4_K_XL, RTX 5090 + RTX 3090): the 5090 alone decoded 63 to 67 tok/s (prompt 978), both
cards 44 to 61 (prompt 893), a 40/8 split 55 to 59, a hybrid with ten native layers on the 3090
41 to 52. The slower card serves its share of the layers with slower kernels over a PCIe 4 link,
and that costs more than the bigger shared cache gains. Equal cards keep the spread.

Planning against the whole box while the child sees only some cards would
over-offload and OOM. With borrowed peers, placement is local-first: capping the
ask at local room keeps the coordinator's RAM-fallback rule from pinning one card
plus CPU, since remote VRAM is the fallback. A layout-derived split must not
suppress the planner's own split: under MoE expert fill it lands every heavy
layer on the last card (a live 36 GB ask of a 24 GB 3090).
