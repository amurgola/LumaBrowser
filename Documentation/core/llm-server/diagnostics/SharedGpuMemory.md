# SharedGpuMemory

`core/llm-server/diagnostics/SharedGpuMemory.js`

Gives GPUs that compute out of system RAM a VRAM figure the launch planner can
offload against.

## Methods

- `SharedGpuMemory.apply(gpu, { totalRamBytes, unified, cudaAvailable })`
  mutates and returns the [GpuProbe](GpuProbe.md) summary, then recomputes
  `totalVramBytes` and `freeVramBytes`:
  - `unified` ([UnifiedMemoryProbe](UnifiedMemoryProbe.md)'s `{ bytes, source }`):
    the first non-Microsoft adapter (or a synthesized `Apple GPU` adapter when
    Chromium listed none, or the probe failed) gets `vramTotalBytes: bytes`,
    `vramFreeBytes: null`, `vramSource: source`, `unifiedMemory: true`; an
    empty or `0x0` vendor becomes `Apple`;
  - otherwise, without CUDA and only when no discrete GPU is present, the
    integrated Intel or AMD adapter gets `max(its figure, half of RAM)`,
    `vramSource: 'shared-memory'`, `integrated: true`; a figure an installed
    build's device list gave (`vramSource: 'llama-list-devices'`) that already
    covers the RAM share is kept as is, with its free figure;
  - a failed probe without `unified`, CUDA available, or no RAM total: unchanged.
- `SharedGpuMemory.isIntegrated(adapter)`: an Intel or AMD adapter flagged
  `integrated`, or with a `win-registry` figure under 2 GiB.
- Constants `GIB`, `INTEGRATED_SHARE`, `INTEGRATED_MAX_DEDICATED_BYTES`,
  `IGPU_VENDORS`.

## Why

Only nvidia-smi and the Windows registry supplied VRAM, so Apple Silicon Macs
and Intel/AMD integrated GPUs planned against 0 bytes and llama-server ran with
`-ngl 0`. Half of RAM matches the shared GPU memory Windows and the Vulkan
drivers expose. An iGPU only counts when no discrete GPU exists, so a hybrid
laptop never adds its iGPU's share to the NVIDIA card's budget. Chromium
sometimes reports the Apple GPU with empty ids or not at all.
