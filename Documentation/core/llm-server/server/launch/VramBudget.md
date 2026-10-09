# VramBudget

`core/llm-server/server/launch/VramBudget.js`

The VRAM one launch may plan against.

## Methods

- `VramBudget.resolve({ diagnostics, overrides, flags })` returns
  `{ rpcServers, rpcFlagSupported, rpcEnabled, perGpu, totalVram, vramAvailableBytes, largestGpuIndex, largestGpuUsableBytes }`.
  - `rpcServers`: `overrides.rpcServers` entries whose `addr` has a `:`;
    `rpcEnabled` when any remain and `--rpc` is accepted;
  - `perGpu`: [GpuInventory](GpuInventory.md) cards, plus remote devices when RPC is on;
  - `vramAvailableBytes`: total minus 1 GiB per card, never negative, capped by a
    positive `overrides.vramCapBytes`;
  - `largestGpuUsableBytes`: the largest card's total minus the reserve.

## Why

Borrowed GPUs join the budget so `-ngl` and the full-offload call count remote
capacity. The cap is the Advanced-tab split slider: it keeps at most that much on
the GPU so the rest offloads through a partial `-ngl`, and never raises the budget.
The single-card size uses total, not free, VRAM on purpose: it sizes a card the
model will own once pinned, so free would double-count the model being planned.
