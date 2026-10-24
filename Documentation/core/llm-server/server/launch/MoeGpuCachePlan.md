# MoeGpuCachePlan

`core/llm-server/server/launch/MoeGpuCachePlan.js`

Decides whether an expert offload runs as "every expert in RAM plus a device cache of
the hot ones" (`--cpu-moe --moe-cache-mib N`) instead of whole layers' experts on the
GPU, and sizes the cache. Called by [MoeExpertPlan](MoeExpertPlan.md) after the layer
fill has been worked out.

## Methods

- `MoeGpuCachePlan.resolve({ overrides, flags, budget, gguf, expertBytes, cpuExpertBytes, fillBudget, maxExpertSliceBytes })`
  returns `{ enabled, bytes, mib, reason }`. On: `bytes` is `fillBudget` (the
  safety-scaled spare VRAM the layer fill would have taken), capped at all the
  expert bytes, rounded down to whole MiB. Off: `reason` says why, in order:
  - `overrides.noMoeGpuCache` (the Setup switch);
  - the build has no `--moe-cache-mib` (`RuntimeFlags.moeCache`);
  - peer GPUs over RPC; `--split-mode tensor`; no local GPU;
  - two or more local cards on a build without the multi-GPU split (`moeCacheMultiGpu`);
  - no `expertCount` / `expertUsedCount` in the header;
  - the layer fill already keeps more than 80% of the expert bytes on the GPU
    (`MIN_CPU_SHARE` 0.2): the model nearly fits;
  - the cache would be under `max(MIN_BYTES (1 GiB), 4 x (expertUsedCount + 1) x the largest expert slice x cards)`.

## Why

Measured on an RTX 5090 with Qwen3.8-Flash-Next UD-Q4_K_XL (111 GB, 32k context,
luma-b4), warm decode: the layer fill 24 to 26 tok/s, layer fill plus a 6.4 GB
cache 27.5 to 29, every expert in RAM plus a 19 GB cache 31 to 36 (still rising as
it warmed). Prompt processing went from 217 to 188 tok/s, because llama.cpp's cache
skips batches above 32 tokens, and the cache path used 3.6 GB less VRAM. A layer whose
experts all live in host memory is what the cache serves, so `--cpu-moe` gives it every
layer. Output quality is unchanged: the cache uploads the exact expert bytes, and the
greedy outputs diverged no more than they did between two cache-free placements.

llama.cpp aborts when a card's share cannot hold the experts one token selects, so the
floor keeps several tokens' worth per card. When the model nearly fits, native layers
beat a slot lookup and a sync per layer, so the layer fill stays. Upstream: PR 29887
(b11480), the multi-GPU split in PR 30112 (b11507), whose budget follows
`--tensor-split` or free memory.
