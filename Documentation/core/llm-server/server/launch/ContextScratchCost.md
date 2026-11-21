# ContextScratchCost

`core/llm-server/server/launch/ContextScratchCost.js`

Prices the part of llama.cpp's GPU compute buffer that grows with the
context: the attention masks and the scratch sized by them.

## Methods (static)

- `bytes({ gguf, contextSize, swaFull, split = false })`: whole bytes for one
  card.
  - One card holding the whole model: `max(FLOOR, BASE + contextSize x
    PER_TOKEN)`, with `FLOOR` 250 MiB, `BASE` 100 MiB and `PER_TOKEN` 5 KiB.
  - A windowed cache (a sliding-window model launched without `--swa-full`)
    multiplies the per-token part by `WINDOWED_FACTOR` 1.8: it keeps a second
    set of masks for its windowed layers.
  - `split: true` (the layers sit on several cards) multiplies the result by
    `SPLIT_FACTOR` 1.6; every card running layers holds that much.
  - 0 for an architecture whose masks are priced one by one
    ([LayerMaskCost](LayerMaskCost.md)), since that price is its compute
    buffer.

## Why

The planner used to treat everything beside weights and KV as a fixed 512
MiB ([GpuOverhead](GpuOverhead.md)`.FIXED`). That number is the CUDA context;
the compute buffer comes on top and grows with the context. It went unnoticed
because the price also counted the input embeddings, which stay on the host,
and the two errors cancelled on most models. With the host tensors taken out
([MoeExpertPlan](MoeExpertPlan.md)`._hostInputBytes`) the scratch has to be
priced, and in a split it has to be priced on every card: on a 5090 + 3090
Qwen3.8-27B at 128k loaded 1.3 and 0.9 GiB above its planned layer bytes,
which used up the 5090's whole safety margin.

Measured 2026-11-20 (upstream b12600, CUDA, flash attention on, micro-batch
512), the CUDA compute buffer per card:

| launch | measured | priced |
|---|---|---|
| Cydonia-24B, one card, 16k / 32k / 64k / 128k | 248 / 264 / 368 / 688 MiB | 250 / 260 / 420 / 740 |
| Qwen3.8-27B, one card, 32k / 64k / 98k | 260 / 420 / 580 MiB | 260 / 420 / 580 |
| Gemma 4 E4B, one card, 32k, `--swa-full` | 288 MiB | 260 |
| Gemma-4-31B, one card, windowed, 32k / 64k | 396 / 684 MiB | 388 / 676 |
| Magidonia-24B, split, 64k | 588 and 678 MiB | 672 each |
| Qwen3.8-27B, split, 128k | 1,144 and 1,234 MiB | 1,184 each |
| Gemma-4-31B, split, windowed, 64k | 901 MiB (58 layers), 306 MiB (2 layers) | 1,082 each |

A micro-batch of 256 or 1,024 moved the 64k single-card figure to 312 and
592 MiB; the price assumes the default 512, which every launch but the expert
offload uses (that one holds its own compute room back, so
[FullOffloadCost](FullOffloadCost.md) leaves this term out for it).

Used by [FullOffloadCost](FullOffloadCost.md),
[LayerFillSplit](LayerFillSplit.md) (per card, `split: true`) and
[PartialOffloadSizer](PartialOffloadSizer.md).
