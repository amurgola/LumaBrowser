# LlmRuntimeDeclarations

`core/llm-server/runtimes/LlmRuntimeDeclarations.js`

Data-only table of the inference runtimes the LLM server knows how to acquire
and run. The detector, installer, launch planner and
[LlmRuntimeCatalog](LlmRuntimeCatalog.md) read it; adding a runtime is a
one-place edit.

## Members

- `LlmRuntimeDeclarations.RUNTIMES`, in order:
  - `llama-cpp-cpu`: universal fallback; Windows zip, Linux and macOS tarballs.
  - `llama-cpp-cuda12`: Windows from ggml-org, Linux from janhq's fork
    (`repos['linux-x64']`); companions are the cudart zip on Windows and, on
    Linux, the cudart bundle plus NCCL from NVIDIA's redist CDN.
  - `llama-cpp-cuda13`: same split with CUDA 13 assets; recommended for RTX 50.
  - `llama-cpp-luma`: LumaByte's patched CUDA 12 build, Windows only, assets named like upstream.
  - `llama-cpp-vulkan`: cross-vendor GPU build for Windows and Linux.
  - `mlx-lm`: Mac-only (`platforms: ['darwin']`), `acquisition: 'manual-source'`
    (pip install, detected on PATH), `launchStyle: 'mlx-server'`.
  - `harmony`: `kind: 'format'`, satisfied by any llama.cpp build at b6000+
    (`dependsOn`, `minLlamaBuild`).
- Shared pieces: `LLAMA_BIN_NAMES`, `GGML_ORG`, `JANHQ_LINUX`,
  `LLAMA_MANUAL_SOURCE_NOTE`, `WIN_CUDA12_ASSET`, `WIN_CUDA12_CUDART`.

Entry fields: `assetPatterns` and `companionAssets` are keyed by
`<platform>-<arch>`; `binaryNames` by platform; `requiresHw` feeds the UI's
"Hardware ready" pill and never blocks install; `protocol` selects the chat
adapter (all `openai-compat`).

## Why the patterns look like that

- ggml-org ships Windows as `.zip` but Linux and macOS as `.tar.gz`; the
  installer extracts either, so patterns accept both.
- Windows CUDA asset names have read `cuda12`, `cuda-12.4`, `cuda-cu12.4` and
  `cuda_12.4` across releases.
- ggml-org has no Linux CUDA release job, so Linux CUDA comes from janhq's fork;
  its tarball has the binary under `build/bin` with a broken RUNPATH, and links
  `libnccl.so.2` without bundling it. The installer consolidates the companions
  into the binary dir and the launcher sets `LD_LIBRARY_PATH`.
- Without the CUDA runtime companions the Windows backend silently falls back
  to CPU and the Linux binary fails to load.
- The luma-llamacpp tags (`luma-bN`) carry no upstream build number, so
  build-floor gates in the launch planner special-case `llama-cpp-luma`.
