# RpcDeviceInventory

`core/network-sharing/host/rpc/RpcDeviceInventory.js`

The per-GPU inventory a lending host advertises and grants from.

## Methods

- `new RpcDeviceInventory({ llmServerService?, readDevices? })`; `readDevices`
  defaults to [CudaDeviceProbe](../../../shared/runtime/CudaDeviceProbe.md)`.readDevices`.
- `probe()` `[{ index, name, vramTotalMB, vramFreeMB }]` (MB rounded, unknown
  free as 0). Reads `readDevices(null)` (a live nvidia-smi query); when that is
  empty or throws, falls back to `readDevices(llmServerService.getCachedDiagnostics())`;
  else `[]`.

## Why

Deliberately not the persisted diagnostics snapshot: it freezes free VRAM at
boot, and consumers budget their layer split against these numbers, so stale
"free" made remote llama.cpp loads overallocate occupied cards.
