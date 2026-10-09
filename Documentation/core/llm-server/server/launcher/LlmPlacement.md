# LlmPlacement

`core/llm-server/server/launcher/LlmPlacement.js`

Picks the GPU(s) for a local start before the real plan.

## Methods

- `new LlmPlacement({ vram })` (a `VramCoordinator`).
- `place(ctx)` plans a probe, reserves `{ serverId: 'llm', role: 'llm', allowSplit: true }`
  for its `modelEstimatedBytes`, and sets `ctx.cudaDevice`, `ctx.tensorSplit` (the
  reservation's `split`) and `ctx.planDiag` (diagnostics narrowed to the reserved
  cards). A user-drawn split over 2+ cards sets `overrides.manualTensorSplitActive`.
  Any failure leaves the start unpinned.
- `placeForRescue(ctx, headerEstimatedBytes)` reserves again for the header
  estimate and returns `{ cudaDevice, diagnostics }`.
- `LlmPlacement.requestedBytes(ctx, need)`: undefined for no need; the whole need
  without peers; with `overrides.rpcServers`, capped at the summed local room
  (free, else total, minus `CudaDevicePicker.PER_CARD_RESERVE_BYTES` per card), at
  least 1, or undefined when there is no local reading.

## Why

Planning against the whole box while the child sees only some cards would
over-offload and OOM. With borrowed peers, placement is local-first: capping the
ask at local room keeps the coordinator's RAM-fallback rule from pinning one card
plus CPU, since remote VRAM is the fallback. A layout-derived split must not
suppress the planner's own split: under MoE expert fill it lands every heavy
layer on the last card (a live 36 GB ask of a 24 GB 3090).
