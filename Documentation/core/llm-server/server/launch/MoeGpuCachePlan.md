# MoeGpuCachePlan

`core/llm-server/server/launch/MoeGpuCachePlan.js`

Decides whether an expert offload runs as "every expert in RAM plus a device cache of
the hot ones" (`--cpu-moe --moe-cache-mib N`) instead of whole layers' experts on the
GPU, and sizes the cache. Called by [MoeExpertPlan](MoeExpertPlan.md) after the layer
fill has been worked out.

## Methods

- `MoeGpuCachePlan.resolve({ overrides, flags, budget, gguf, expertBytes, cpuExpertBytes, fillBudget, maxExpertSliceBytes })`
  returns `{ enabled, bytes, mib, promptBatch, promptBufferBytes, promptReserveBytes, reason }`. On:
  `bytes` is `fillBudget` (the safety-scaled spare VRAM the layer fill would have taken) less
  `promptReserveBytes`, capped at all the expert bytes, rounded down to whole MiB. Off: `reason`
  says why, in order:
  - `overrides.noMoeGpuCache` (the Setup switch);
  - the build has no `--moe-cache-mib` (`RuntimeFlags.moeCache`);
  - peer GPUs over RPC; `--split-mode tensor`; no local GPU;
  - two or more local cards on a build without the multi-GPU split (`moeCacheMultiGpu`);
  - no `expertCount` / `expertUsedCount` in the header;
  - the layer fill already keeps more than 80% of the expert bytes on the GPU
    (`MIN_CPU_SHARE` 0.2): the model nearly fits;
  - the cache would be under `max(MIN_BYTES (1 GiB), 4 x (expertUsedCount + 1) x the largest expert slice x cards)`.
- `floorBytesPerCard(gguf, maxExpertSliceBytes)`: the smallest cache worth giving one card
  (the slot floor above, never under `MIN_BYTES`); [MoeExpertPlan](MoeExpertPlan.md) adds it to
  the resident share and staging buffer as `gpuCache.singleCardBytes`, the launcher's single-card ask.
- `promptReserve({ fillBudget, budget })` returns `{ batch, bufferBytes, reserveBytes }`: the largest
  of `PROMPT_BATCH_STEPS` (4096, 2048, 1024, 512) whose activations, `batch x PROMPT_TOKEN_BYTES`
  (256 KB) on every local card, stay within `MAX_PROMPT_RESERVE_SHARE` (0.35) of `fillBudget`.
  `bufferBytes` is one card's share, `reserveBytes` all cards'. `promptBatch` is that batch, or null
  when the 512 default stands; [LaunchArgsBuilder](LaunchArgsBuilder.md) emits it as `-b N -ub N`.

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

Prompt batches bypass the cache: for each micro-batch llama.cpp stages a layer's host
expert tensor on the card running that layer, inside that card's compute buffer, so the upload
cost is per micro-batch, not per token. Measured on the
same card and model with pinned host experts (`--load-mode none`, 2026-11-02): prompt
processing went 395 tok/s at the 512 default, 978 at 2048, 1504 at 4096 and 1517 at 8192,
with decode unchanged; 4096 costs about 0.8 GB more peak VRAM than 512 and 8192 another
0.5 GB for nothing, so the knee is 4096. The same session measured
pinned host experts at 59 tok/s decode against 31 memory-mapped, and the cache size as
the next lever (4 GB 37, 8 GB 46, 15 GB 59 tok/s), so the plan still hands the cache all
the spare VRAM.

The prompt reserve came from DeepSeek-V4.1-Flash on a 5090 + 3090 (2026-11-02): llama.cpp's
prompt compute buffer on the first card was 5.7 GB (4.8 GB of it the fused gate/up expert
tensor being staged, the rest activations at 4096 tokens), and a plan that had sized the
cache to the pool without holding that back per card failed with `cudaMalloc out of memory`
half a gigabyte above a launch that had survived at 31.96 of 32.6 GB. The staging share is
[MoeExpertPlan](MoeExpertPlan.md)'s `stagingBytes`; the activations are this reserve, about
0.22 MB per token on both models measured, rounded up.
