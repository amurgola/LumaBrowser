# VramBudget

`core/llm-server/server/launch/VramBudget.js`

The VRAM one launch may plan against.

## Methods

- `VramBudget.resolve({ diagnostics, overrides, flags })` returns
  `{ rpcServers, rpcFlagSupported, rpcEnabled, perGpu, totalVram, vramAvailableBytes, fullOffloadRoomBytes, largestGpuIndex, largestGpuUsableBytes }`.
  - `rpcServers`: `overrides.rpcServers` entries whose `addr` has a `:`;
    `rpcEnabled` when any remain and `--rpc` is accepted;
  - `perGpu`: [GpuInventory](GpuInventory.md) cards, plus remote devices when RPC is on;
  - `vramAvailableBytes`: the sum of `GpuOverhead.cardRoom` over the cards (total
    less live occupancy when read live, less the GPU headroom), capped by a positive
    `overrides.vramCapBytes`;
  - `fullOffloadRoomBytes`: the room a full offload is judged against. On a budget of
    exactly one local card that is not unified memory, that card's room down to
    `GpuOverhead.SOFT_CARD_RESERVE` (half the headroom), capped the same way and never
    below `vramAvailableBytes`; otherwise equal to `vramAvailableBytes`;
  - `largestGpuUsableBytes`: `cardRoom` of the card with the most total VRAM.

## Why

Borrowed GPUs join the budget so `-ngl` and the full-offload call count remote
capacity. The cap is the Advanced-tab split slider: it keeps at most that much on
the GPU so the rest offloads through a partial `-ngl`, and never raises the budget.
Occupancy is netted out only when the launch read the cards live just before
planning (`diagnostics._liveMemoryAt`, set by `CudaDeviceProbe.withLiveMemory`): by
then any previous model is stopped and this one has not loaded, so free VRAM is
exactly what the display, other apps and other servers leave. The persisted snapshot
can date from a moment this very model was resident, so an estimate that plans from it
keeps the old total-minus-headroom sizing. The fit matrix ([LocalModelOptions](../../ipc/LocalModelOptions.md))
plans from a live reading with the loaded chat model's own VRAM handed back, and falls
back to the snapshot only when that reading fails.

The soft full-offload room applies to one card only because there the alternative to
"it all fits here" is layers on the CPU (or, at the launcher's card pick, a slower
second card), both far slower than a tighter margin (see
[GpuHeadroom](../../../shared/runtime/GpuHeadroom.md)). With several cards the split
moves layers instead and the headroom holds. A unified-memory SoC keeps the strict room:
its last bytes come from moving the input embeddings to plain RAM.
