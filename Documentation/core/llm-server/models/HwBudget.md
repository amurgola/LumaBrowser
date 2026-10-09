# HwBudget

`core/llm-server/models/HwBudget.js`

Maps a diagnostics snapshot to the flat hardware budget every pre-download
picker reads: the onboarding recommender, the automatic setup planner and the
wizard's hardware summary line. Pure; the caller gathers diagnostics.

## Methods

- `HwBudget.build(diagnostics, { cudaRuntimePreference }?)` returns
  `{ usableVramBytes, vramTotalBytes, usableRamBytes, ramTotalBytes,
  cudaAvailable, cudaVersion, hasGpu, gpuName, cpuModel, cpuCores, gpus,
  ramBandwidthGbps, recommendedRuntimeId }`.
  - `gpus` is `[{ name, totalBytes, maxBytes }]` in `budget.vram.perAdapter`
    order, with the driver reserve already subtracted.
  - `hasGpu` ignores the Microsoft basic display adapter; `gpuName` prefers the
    first CUDA device.
  - `ramBandwidthGbps` comes from [MemoryBandwidth](../MemoryBandwidth.md)`.resolveRamBandwidth`.
  - `recommendedRuntimeId` is `llama-cpp-cpu` on macOS, the first id of
    `cudaRuntimePreference(cudaVersion)` with CUDA (default `llama-cpp-cuda12`),
    `llama-cpp-vulkan` with another GPU, else `llama-cpp-cpu`.
  - Missing diagnostics give zeros and nulls, never a throw.

## Why

One mapping shared by main-process handlers, the pure planners and their tests.
macOS has no CUDA or Vulkan llama.cpp builds; only the CPU runtime has a darwin
asset (Metal-accelerated), so recommending anything else fails with "No prebuilt
asset". The CUDA preference is passed in (from
[LlmRuntimeCatalog](../runtimes/LlmRuntimeCatalog.md)`#cudaRuntimePreference`) so
this class stays free of the catalog.
