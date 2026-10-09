# GpuInventory

`core/llm-server/server/launch/GpuInventory.js`

Lists the GPUs a llama.cpp launch can budget against.

## Methods

- `GpuInventory.fromDiagnostics(diagnostics)` returns `[{ name, totalBytes, freeBytes? }]`:
  CUDA cards (`memoryTotalMB`, live `memoryFreeMB` or null, name default
  `NVIDIA GPU`, zero-VRAM cards dropped); only when there are none, registry
  adapters except Microsoft's Basic Render Driver (`displayName`, `deviceString`,
  `vendor` or `GPU`).
- `GpuInventory.remoteDevices(rpcServers)` returns one `{ name, totalBytes, remote: true }`
  per reported remote device (`<label> GPU<index> (RPC <addr>)`), or one aggregate
  `<label> (RPC <addr>)` for hosts without a breakdown; label default `Peer`.
- `GpuInventory.usableRemoteBytes(entry)`: free bytes when positive, else total.
- `GpuInventory.largestIndex(perGpu)`: the most total VRAM, first on a tie, -1 for none.

## Why

CUDA rows win so cards are never double-counted. Vulkan boxes (AMD, Intel) only
report totals from the registry. Remote cards are budgeted by free VRAM because a
peer may run its own models; one entry per remote device makes the per-card
reserve count every real card (the old aggregate under-reserved a multi-GPU peer).
