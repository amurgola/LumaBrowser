# RuntimeFlags

`core/llm-server/server/launch/RuntimeFlags.js`

What one llama.cpp runtime build accepts, so the planner never emits a flag the
binary's argparser would reject.

## Methods

- `new RuntimeFlags(runtime)` exposes `id`, `name`, `binaryPath`, `unsupported`
  (Set), `skipFeatures` (Set), `extraArgs` (a copy), `specDialect`
  (`'ik'` or `'mainline'`), `build` ([LlamaBuildNumber](../../../shared/runtime/detect/LlamaBuildNumber.md)`.parse(version)`), `isLuma`, and booleans:
  - feature flags: `flashAttn`, `swaFull`, `contextShift` (`--no-context-shift`),
    `parallel`, `cacheReuse`, `cacheRam`, `slotSimilarity`, `rpc`, `cpuMoe`,
    `splitMode`, `tensorSplit`, `fit`, `noMmap`;
  - speculation: `specType`, `mtpFlags` (`--spec-type` plus, in the mainline
    dialect, `--spec-draft-n-max`), `specDrafterFlags` (also `--model-draft` and
    `-md`), `draftCacheFlags` (both draft cache-type flags);
  - build gates: `loadMode` (accepted and b10105+, the luma fork, or `--no-mmap`
    already learned as rejected), `fitOff` (b10621+ or luma), `tensorSplitRuntime`
    (CUDA 12/13 or luma ids), `tensorSplitBuild` (b9000+ or luma), `moeCache`
    (`--moe-cache-mib` accepted and b11480+, or a luma tag luma-b4+) and
    `moeCacheMultiGpu` (b11507+, or luma-b4+). A luma build with no readable tag gets no cache.
- `accepts(flag)`.
- `TENSOR_SPLIT_MIN_BUILD` (9000), `LOAD_MODE_MIN_BUILD` (10105),
  `FIT_OFF_MIN_BUILD` (10621), `MOE_CACHE_MIN_BUILD` (11480), `MOE_CACHE_MULTI_GPU_MIN_BUILD` (11507),
  `LUMA_RUNTIME_ID`, `LUMA_MOE_CACHE_MIN_TAG` (4), `TENSOR_SPLIT_RUNTIME_IDS`.

## Why

An unknown flag is fatal to llama-server (exit 1 with the help text). Forks list
what they lack in `unsupportedFlags`; the launcher's rescue learns more through
[UnsupportedFlagMemory](../UnsupportedFlagMemory.md). b10875 deleted `--no-mmap`
for `--load-mode none`, so a learned `--no-mmap` rejection proves the newer
spelling even when the version is unreadable. The luma fork's tags carry no
upstream build number, so it is gated by id.
