# FitVramMath

`core/llm-server/models/FitVramMath.js`

The coarse pre-download VRAM arithmetic every model picker shares.

## Methods

- `FitVramMath.kvBytes(paramsB, ctx, kvType)`: `(paramsB / 7) x (ctx / 32768) x 2 GiB`,
  times `Q8_KV_FRACTION` (0.55) for `'q8_0'`.
- `FitVramMath.kvBytesAt8k(paramsB)`: `kvBytes(Number(paramsB) || 7, 8192, 'f16')`.
- `GPU_OVERHEAD` (1 GiB), `GB`, `Q8_KV_FRACTION`.

## Why

Before download there is no header, only a parameter count. The KV size is
calibrated to ~2 GB for a 7B-class GQA model at 32K (Qwen2.5-7B: 28 layers x 4 KV
heads x 128 dim, about 1.75 GB, rounded up). Keyed off total params it
over-prices MoE attention, which errs toward less context, never toward OOM. The
fit badge, the onboarding recommender and the automatic setup planner share these
numbers so they budget identically.
