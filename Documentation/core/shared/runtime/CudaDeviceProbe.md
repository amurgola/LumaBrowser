# CudaDeviceProbe

`core/shared/runtime/CudaDeviceProbe.js`

Reads the CUDA cards a server can be pinned to, from a diagnostics snapshot or
the cached reading of the shared [NvidiaSmiStream](NvidiaSmiStream.md).
Synchronous by contract and never spawns: the stream keeps the reading fresh in
the background.

## Methods

- `CudaDeviceProbe.readDevices(diagnostics)` returns
  `[{ index, name, totalBytes, freeBytes }]`. Uses `diagnostics.cuda.devices`
  when CUDA is available and the list is non-empty (`memoryTotalMB`,
  `memoryFreeMB` scaled to bytes, `freeBytes` null when not reported, name
  defaulting to `CUDA<i>`, index the array position); otherwise the stream
  snapshot's rows, dropping cards reporting no total VRAM and keeping
  nvidia-smi's own `index` for the rest. That index is the CUDA device index
  used in `CUDA_VISIBLE_DEVICES` (nvidia-smi enumerates in PCI-bus order, the
  order CUDA uses once `CUDA_DEVICE_ORDER=PCI_BUS_ID` is set), so a dropped or
  malformed card never shifts its neighbours. Before the stream's first reading
  the live list is empty; a synchronous read that beats it on a running stream
  starts a one-shot `refresh()` so the next read sees the cards.
- `CudaDeviceProbe.whenReady(timeoutMs = READY_MS)` the stream's `whenReady`,
  bounded (3 s) and never rejecting (null when the stream has none). Launch and
  placement entry points (`LaunchPreflight.resolve`, `ImageSlotPlacement.place`,
  `GroundingServerService._reserveCard`, `MusicServerService._liveDiagnostics`)
  await it before any live card read, so an early launch never places as if
  there were no GPUs.
- `CudaDeviceProbe.withLiveMemory(diagnostics, { query })` returns a copy with
  each device's `memoryTotalMB` and `memoryFreeMB` replaced by a live reading
  and `_liveMemoryAt` stamped. A live row lands on the cached device whose
  position equals its `index`, else by position. A null live free value keeps
  the cached one. Returns the input unchanged when it has no available CUDA
  devices, the reading is empty, the card counts differ, or anything throws.
- `CudaDeviceProbe.withFreshLiveMemory(diagnostics, { maxAgeMs = 0, timeoutMs = FRESH_READ_TIMEOUT_MS })`
  asks a running stream for a reading no older than `maxAgeMs` (bounded by
  `timeoutMs`, 2 s), then `withLiveMemory`. Never rejects. The LLM launch uses it
  right before placement.
  `query` is a test seam defaulting to the stream snapshot's rows.
- `CudaDeviceProbe.readComputeApps()` returns `{ pid: bytes }` of resident VRAM
  per CUDA process: the stream's last list, refreshed in the background when a
  card's used bytes moved (`NvidiaSmiStream.cachedComputeApps`). Empty before
  the first list.
- `CudaDeviceProbe.gpuCount()` returns the stream's card count, cached for the
  process lifetime once a good reading exists; before that the live count is
  returned without being cached.
- `CudaDeviceProbe.diagnosticsDevices(diagnostics)` returns the raw
  `cuda.devices` array when CUDA is available, else `null`.
- `CudaDeviceProbe.stream` test seam: an object with `snapshot()` and
  `cachedComputeApps()`; `null` means `NvidiaSmiStream.shared`.
- `CudaDeviceProbe.MIB`.

## Why

The persisted diagnostics cache is refreshed rarely; its free VRAM can be from
boot with an empty card. Placement sized against it saw VRAM a resident model
already held (the 2026-08-29 image-size bench pinned the image server onto a
5090 that was 29 of 32 GB full), so callers overlay a live reading first.

The live reading used to be `execFileSync` on the main process on every
placement decision, hotswap wait poll and sampler tick. The stream's snapshot
is at most an interval old and costs nothing to read.
