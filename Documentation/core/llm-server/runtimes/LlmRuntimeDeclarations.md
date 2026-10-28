# LlmRuntimeDeclarations

`core/llm-server/runtimes/LlmRuntimeDeclarations.js`

Data-only table of the inference runtimes the LLM server knows how to acquire
and run. The detector, installer, launch planner and
[LlmRuntimeCatalog](LlmRuntimeCatalog.md) read it; adding a runtime is a
one-place edit.

## Members

- `LlmRuntimeDeclarations.RUNTIMES`, in order:
  - `llama-cpp-cpu`: universal fallback; Windows zip (x64 and arm64), Linux and macOS tarballs.
    `hostLabels['darwin-arm64']` shows it as "llama.cpp (Metal)" with a Metal
    description, since ggml-org's macOS arm64 build is Metal-accelerated.
  - `llama-cpp-cuda12`: ggml-org on Windows and Linux (`ubuntu-cuda-12.x`
    builds, `LINUX_CUDA12_ASSET`); the only companion is the cudart bundle
    (cudart + cuBLAS): `WIN_CUDA12_CUDART` / `LINUX_CUDA12_CUDART`.
  - `llama-cpp-cuda13`: same with CUDA 13 assets; recommended for RTX 50. Also
    the one CUDA build ggml-org ships for Windows arm64 (asset and cudart companion).
  - `llama-cpp-luma`: LumaByte's patched CUDA 12 build, Windows only, assets named like upstream.
  - `llama-cpp-vulkan`: cross-vendor GPU build for Windows (x64 and arm64) and Linux.
  - `llama-cpp-opencl-adreno`: Qualcomm Adreno OpenCL build for Snapdragon X,
    `platforms: ['win32-arm64']` (the only arch it exists for, so x64 hosts never
    list it), `requiresHw: { kind: 'qualcomm-gpu' }`, `backendDevice: 'GPUOpenCL'`
    (ggml's OpenCL backend names its single device without an index).
  - `llama-cpp-rocm`: AMD ROCm/HIP build, `requiresHw: { kind: 'amd-gpu' }`;
    the Windows build needs the AMD HIP SDK (hipBLAS/rocBLAS are not bundled),
    Linux needs a system ROCm.
  - `llama-cpp-sycl`: Intel SYCL/oneAPI build, `requiresHw: { kind: 'intel-sycl' }`
    (an Intel GPU plus, on Linux, the Level Zero GPU driver);
    Windows bundles the oneAPI runtime, Linux (the `sycl-fp16` asset) needs
    oneAPI installed.
  - `llama-cpp-openvino`: Intel OpenVINO build (experimental), `requiresHw:
    { kind: 'intel-openvino' }` (an Intel GPU plus, on Linux, Intel's OpenCL
    ICD), bundles its runtime including the NPU plugin;
    `spawnEnv: { GGML_OPENVINO_DEVICE: 'GPU' }`, which a user's own value overrides.
  - `mlx-lm`: Mac-only (`platforms: ['darwin']`), `acquisition: 'manual-source'`
    (pip install, detected on PATH), `launchStyle: 'mlx-server'`.
  - `harmony`: `kind: 'format'`, satisfied by any llama.cpp build at b6000+
    (`dependsOn` lists the CPU, CUDA 12/13, Vulkan, OpenCL-Adreno, ROCm, SYCL and OpenVINO
    builds; `minLlamaBuild`).
- Shared pieces: `LLAMA_BIN_NAMES`, `GGML_ORG`, `LLAMA_MANUAL_SOURCE_NOTE`,
  `WIN_CUDA12_ASSET`, `WIN_CUDA12_CUDART`, `LINUX_CUDA12_ASSET`,
  `LINUX_CUDA12_CUDART`.

Entry fields: `assetPatterns` and `companionAssets` are keyed by
`<platform>-<arch>`; `binaryNames` by platform; `backendDevice` (the
device-name prefix the build's backend registers in `--list-devices`: `CUDA`,
`Vulkan`, `GPUOpenCL`, `ROCm`, `SYCL`, `OPENVINO`) and `backendLib` (the ggml library stem,
`hip` for `libggml-hip.so`) drive the detector's
[BackendDeviceCheck](../../shared/runtime/detect/BackendDeviceCheck.md);
`requiresHw` feeds the UI's
"Hardware ready" pill and never blocks install; `protocol` selects the chat
adapter (all `openai-compat`); `hostLabels` renames an entry per
`<platform>-<arch>`; `spawnEnv` is extra environment for the child process.

## Why the patterns look like that

- ggml-org ships Windows as `.zip` but Linux and macOS as `.tar.gz`; the
  installer extracts either, so patterns accept both.
- Windows CUDA asset names have read `cuda12`, `cuda-12.4`, `cuda-cu12.4` and
  `cuda_12.4` across releases.
- Linux CUDA now comes from ggml-org's `ubuntu-cuda` builds, which ship the
  per-microarch ggml-cpu backends and need only the cudart sidecar; the janhq
  fork and its NCCL download are gone. The installer still consolidates the
  companions into the binary dir and the launcher sets `LD_LIBRARY_PATH`.
- Without the CUDA runtime companions the Windows backend silently falls back
  to CPU and the Linux binary fails to load.
- The luma-llamacpp tags (`luma-bN`) carry no upstream build number, so
  build-floor gates in the launch planner special-case `llama-cpp-luma`.

## Why the vendor builds

ggml-org publishes ROCm, SYCL and OpenVINO builds, usually faster than Vulkan
on their vendor's GPU. They need a vendor SDK (ROCm on Windows and Linux, SYCL
on Linux) or are experimental (OpenVINO), so the UI prefers them once installed
but never suggests downloading them; Vulkan remains the suggestion. OpenVINO
picks its device from `GGML_OPENVINO_DEVICE` (`GPU` by default; `NPU` targets an
Intel NPU). On a Mac the CPU id is the Metal build, so the planner needs a real
VRAM figure there (see [UnifiedMemoryProbe](../diagnostics/UnifiedMemoryProbe.md)).
