# VramBudget

`core/llm-server/server/launch/VramBudget.js`

The VRAM one launch may plan against.

## Methods

- `VramBudget.resolve({ diagnostics, overrides, flags })` returns
  `{ rpcServers, rpcFlagSupported, rpcEnabled, perGpu, totalVram, vramAvailableBytes, largestGpuIndex, largestGpuUsableBytes }`.
  - `rpcServers`: `overrides.rpcServers` entries whose `addr` has a `:`;
    `rpcEnabled` when any remain and `--rpc` is accepted;
  - `perGpu`: [GpuInventory](GpuInventory.md) cards, plus remote devices when RPC is on;
  - `vramAvailableBytes`: the sum of `GpuOverhead.cardRoom` over the cards (total
    less live occupancy when read live, less the GPU headroom), capped by a positive
    `overrides.vramCapBytes`;
  - `largestGpuUsableBytes`: `cardRoom` of the card with the most total VRAM.

## Why

Borrowed GPUs join the budget so `-ngl` and the full-offload call count remote
capacity. The cap is the Advanced-tab split slider: it keeps at most that much on
the GPU so the rest offloads through a partial `-ngl`, and never raises the budget.
Occupancy is netted out only when the launch read the cards live just before
planning (`diagnostics._liveMemoryAt`, set by `CudaDeviceProbe.withLiveMemory`): by
then any previous model is stopped and this one has not loaded, so free VRAM is
exactly what the display, other apps and other servers leave. The persisted snapshot
can date from a moment this very model was resident, so estimates that plan from it
(the fit matrix's `RungEstimator`) keep the old total-minus-headroom sizing.
