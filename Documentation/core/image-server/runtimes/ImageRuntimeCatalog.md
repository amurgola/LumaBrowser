# ImageRuntimeCatalog

`core/image-server/runtimes/ImageRuntimeCatalog.js`

The image-generation runtimes: four flavours of stable-diffusion.cpp's
`sd-server`, consumed by the runtime detector, installer and the image launch
planner. Extends [RuntimeCatalog](../../shared/runtime/RuntimeCatalog.md).

## Methods

- `new ImageRuntimeCatalog()` wraps `ImageRuntimeCatalog.RUNTIMES`.
- Inherited: `getCatalog`, `getById`, `platformKey`, `getAssetPattern`,
  `getRepo`, `getCompanionAssetPatterns`, `getBinaryNames`, `fingerprint`.
- Statics: `RUNTIMES`, `SD_BIN_NAMES`, `CUDART_COMPANION`, `WIN_CUDA12_ASSET`.

## Rows

| id | build | platforms |
|---|---|---|
| `sd-cpp-cpu` | leejet CPU (avx2/avx/noavx, Linux, macOS) | all |
| `sd-cpp-cuda12` | leejet CUDA 12 + cudart companion zip | win32 |
| `sd-cpp-luma` | amurgola/luma-sdcpp (patched, CUDA 12) | win32 |
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
