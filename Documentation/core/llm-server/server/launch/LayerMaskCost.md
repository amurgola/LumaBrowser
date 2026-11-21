# LayerMaskCost

`core/llm-server/server/launch/LayerMaskCost.js`

Prices the attention masks llama.cpp keeps in the GPU compute buffer for
architectures whose graph builds one per pass through a block (Inkling 2).

## Methods (static)

- `applies(gguf)`: true for the GGUF architectures in `ARCHITECTURES`
  (`inkling2`, `inkling2_loop`), whatever the case; false without a header.
- `passes(gguf)`: passes through a block per token, every stored block once
  and a looped core block once per pass of the loop
  ([LoopCoreLayout](LoopCoreLayout.md)`.visitsAt`). Inkling 2 Mini: 48.
- `bytes(gguf, contextSize, microBatch = 512)`: `(passes + SHARED_MASKS) x
  contextSize x microBatch x 4` bytes, or 0 for an architecture that keeps no
  such masks. `SHARED_MASKS` is 3, `DEFAULT_MICRO_BATCH` is llama.cpp's `-ub`
  default.

## Why

Every other model's compute buffer stays near constant with the context, so
the planner prices it as the fixed [GpuOverhead](GpuOverhead.md). Inkling 2
has no RoPE; its graph carries a mask of context x micro-batch floats for
every pass through a block, and that scratch grows with the context. Unpriced,
the estimate was 3 GiB low at 32k and 6 GiB low at 64k, so the planner kept a
64k launch on a card it then filled to the brim (decode fell from about 70 to
37 to 45 tok/s) and never considered anything else.

Measured 2026-11-20 on Inkling 2 Mini IQ4_NL with upstream b12600 (CUDA
compute buffer, `--swa-full`):

| context | `-ub` | compute buffer | masks by the formula | rest |
|---|---|---|---|---|
| 8k | 512 | 999.72 MiB | 816 MiB | 183.72 |
| 16k | 512 | 1815.72 MiB | 1632 MiB | 183.72 |
| 32k | 512 | 3447.72 MiB | 3264 MiB | 183.72 |
| 64k | 512 | 6711.72 MiB | 6528 MiB | 183.72 |
| 32k | 256 | 1723.91 MiB | 1632 MiB | 91.91 |
| 32k | 1024 | 6895.33 MiB | 6528 MiB | 367.33 |

The rest depends on the micro-batch alone and sits inside the fixed overhead.
The KV precision (f16 or q8_0) and `--no-kv-offload` do not change the
buffer. `inkling2` (Inkling 2 Small, no loop) is taken to build its graph the
same way; it was not run.

Used by [FullOffloadCost](FullOffloadCost.md) (the price) and
[MicroBatchPlan](MicroBatchPlan.md) (the micro-batch that shrinks it).
