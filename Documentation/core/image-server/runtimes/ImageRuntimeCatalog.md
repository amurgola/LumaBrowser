# ImageRuntimeCatalog

`core/image-server/runtimes/ImageRuntimeCatalog.js`

The image-generation runtimes: four flavours of stable-diffusion.cpp's
`sd-server`, consumed by the runtime detector, installer and the image launch
planner. Extends [RuntimeCatalog](../../shared/runtime/RuntimeCatalog.md).

## Methods

- `new ImageRuntimeCatalog()` wraps `ImageRuntimeCatalog.RUNTIMES`.
- Inherited: `getCatalog`, `getById`, `platformKey`, `getAssetPattern`,
  `getRepo`, `getCompanionAssetPatterns`, `getBinaryNames`, `fingerprint`.
- Statics: `RUNTIMES`, `SD_BIN_NAMES`, `CUDART_COMPANION`, `WIN_CUDA12_ASSET`,
  `WIN_ARM64_CUDA13_ASSET`, `CUDART_ARM64_COMPANION`.

## Rows

| id | build | platforms |
|---|---|---|
| `sd-cpp-cpu` | leejet CPU (Windows `cpu`, formerly avx2/avx/noavx; Linux, macOS) | all |
| `sd-cpp-cuda12` | leejet CUDA 12 + cudart companion zip | win32 |
| `sd-cpp-luma` | amurgola/luma-sdcpp (patched; CUDA 12 on x64, CUDA 13 on Windows on Arm) | win32 |
| `sd-cpp-vulkan` | leejet Vulkan | win32, linux |

Every row is `kind: 'image-inference'` and `protocol: 'sd-cpp-http'` (the video
adapter is picked per model row, not per runtime).

## Why

- One project serves every image and video model, so rows differ only by
  backend and build source.
- leejet names macOS and Linux assets after the build host
  (`Darwin-macOS-15.7.7-arm64`, `Linux-Ubuntu-24.04-x86_64[-vulkan]`), hence the
  tolerant patterns, pinned in tests against real release names.
- CUDA 12 is Windows only: leejet has never shipped a Linux CUDA build, so a
  Linux pattern could never match and Install always failed. `platforms`
  hides it elsewhere; Linux NVIDIA routes to Vulkan, and `manualSourceUrl` /
  `manualSourceNote` give the build-and-Locate path.
- The CUDA runtime DLLs ship in a separate `cudart-sd-bin-win-cu12-x64.zip`;
  without it `sd-server.exe` exits with STATUS_DLL_NOT_FOUND on its first CUDA
  call. The companion pattern tolerates `cuda-12.4` / `cu_12.4` renames.
- `sd-cpp-luma` mirrors leejet's asset names so the same installer machinery
  applies; it prepares edit references much faster (38 s to 12 s on a
  three-image Qwen-Image 2.1 edit) with pixel-identical output.
- leejet ships no Windows on Arm build, so on an RTX Spark `sd-cpp-luma` is the
  only image runtime with a download: from `luma-b3` the luma-sdcpp release also
  carries `sd-<tag>-bin-win-cuda13-arm64.zip` and
  `cudart-sd-bin-win-cu13-arm64.zip` (built by its
  `build-windows-cuda-arm64.ps1`, sm_121a). `requiresHw` stays at CUDA 12
  because every NVIDIA Windows on Arm machine ships an R580+ driver.
- leejet's Windows CPU build was one zip per ISA (avx2/avx/noavx) until
  2026-10 and is now one `win-cpu-x64` zip; the pattern takes both.
