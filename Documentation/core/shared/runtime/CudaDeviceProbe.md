# CudaDeviceProbe

`core/shared/runtime/CudaDeviceProbe.js`

Reads the CUDA cards a server can be pinned to, from a diagnostics snapshot or a
live [NvidiaSmi](NvidiaSmi.md) probe.

## Methods

- `CudaDeviceProbe.readDevices(diagnostics)` returns
  `[{ index, name, totalBytes, freeBytes }]`. Uses `diagnostics.cuda.devices`
  when CUDA is available and the list is non-empty (`memoryTotalMB`,
  `memoryFreeMB` scaled to bytes, `freeBytes` null when not reported, name
  defaulting to `CUDA<i>`); otherwise probes nvidia-smi, drops cards reporting
  no total VRAM and re-indexes the rest. The array position is the CUDA device
  index used in `CUDA_VISIBLE_DEVICES` (nvidia-smi lists in PCI-bus order, the
  order CUDA uses once `CUDA_DEVICE_ORDER=PCI_BUS_ID` is set).
- `CudaDeviceProbe.withLiveMemory(diagnostics, { query })` returns a copy with
  each device's `memoryTotalMB` and `memoryFreeMB` replaced by a live reading
  and `_liveMemoryAt` stamped. Live rows are matched by position. A null live
  free value keeps the cached one. Returns the input unchanged when it has no
  available CUDA devices, nvidia-smi returns nothing, the card counts differ,
  or anything throws. `query` is a test seam defaulting to
  `NvidiaSmi.queryGpusSync`.
- `CudaDeviceProbe.readComputeApps()` returns `{ pid: bytes }` of resident VRAM
  per CUDA process (empty when nvidia-smi is unavailable), so the placement UI
  can show the exact VRAM each server child holds.
- `CudaDeviceProbe.gpuCount()` returns the nvidia-smi GPU count, probed once
  and cached for the process lifetime.
- `CudaDeviceProbe.diagnosticsDevices(diagnostics)` returns the raw
  `cuda.devices` array when CUDA is available, else `null`.
- `CudaDeviceProbe.MIB`.

## Why

The persisted diagnostics cache is refreshed rarely; its free VRAM can be from
boot with an empty card. Placement sized against it saw VRAM a resident model
already held (the 2026-08-29 image-size bench pinned the image server onto a
5090 that was 29 of 32 GB full), so callers overlay a live reading first.
