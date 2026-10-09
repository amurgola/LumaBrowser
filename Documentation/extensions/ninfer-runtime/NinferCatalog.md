# NinferCatalog

`extensions/ninfer-runtime/NinferCatalog.js`

The serializable NInfer runtime row plus the build sources and VRAM figures the
installer and planner use.

## Statics

- `RUNTIME_ID` (`'ninfer'`), `GiB`.
- `RUNTIME_ENTRY`: `acquisition: 'extension'`, platforms win32 and linux,
  `requiresHw` (CUDA 13, GPU name `RTX 5090` with its note), a platform-specific
  `requirementNote`, `protocol: 'openai-compat'`, the `request` dialect,
  `launchStyle: 'ninfer'`, `modelKinds: ['ninfer']`, repo, manual source URL,
  `prebuilt`, `source`.
- `PREBUILT`: `{ url, sha256, version, asset }`; `url` is
  `LUMA_NINFER_PREBUILT` (an http(s) URL or local path) read at load, else null.
- `SOURCE`: the upstream git repo and the pinned commit `feaf4dd0`.
- `KV_BYTES_PER_TOKEN` (about 69.2 KB), `WORKSPACE_BYTES` (2.5 GiB).

## Why

NInfer publishes no Linux binaries, so LumaByte ships a self-contained tarball
(ninfer-serve, libcudart.so.13, the FFmpeg libs and an LD_LIBRARY_PATH
wrapper). The commit is pinned so a build reproduces the benchmarked one.

The `request` block is NInfer's Chat Completions dialect: the thinking dial is
the top-level `reasoning_effort` (`none|low|medium|xhigh`) or
`enable_thinking`; any other `chat_template_kwargs` key is a 400, and
llama.cpp's sampler extensions are dropped. `modelKinds` makes it the only home
for `.ninfer` files in the Defaults picker.

The KV figure was measured on the 5090 (2026-08-26): 8.98 GiB for 139,264
tokens with the INT8 group-64 cache. The workspace covers the workspace,
CUDA-graph and media arenas observed on top of weights and KV.
