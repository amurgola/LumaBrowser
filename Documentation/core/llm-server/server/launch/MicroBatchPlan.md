# MicroBatchPlan

`core/llm-server/server/launch/MicroBatchPlan.js`

Picks the prompt micro-batch (`-ub`) of a model whose compute buffer holds an
attention mask per block pass ([LayerMaskCost](LayerMaskCost.md)).

## Methods (static)

- `resolve(state)` with `state: { files, kv, flags, spec, vision, budget }`
  returns `{ microBatch, reduced, maskBytes, savedBytes }`:
  - `microBatch`: the largest of `STEPS` (512, 256, 128) at which the whole
    model, priced by [FullOffloadCost](FullOffloadCost.md) with the window
    cache its launch will use (full-size, `swaFull`, except for a model that
    rewinds by checkpoint, which never gets it), fits
    `budget.largestGpuUsableBytes`, the room on the best card; the smallest
    step when none fits;
  - `reduced`: `microBatch` is below llama.cpp's 512, the only case in which
    [LaunchArgsBuilder](LaunchArgsBuilder.md) sends `-ub`;
  - `maskBytes`: the mask scratch at that micro-batch (0 for a model without
    such masks); `savedBytes`: what stepping down from 512 saved.
  A model without per-pass masks, or a host with no GPU room, keeps 512.

It runs first in the planner's placement stage, so
[MoeExpertPlan](MoeExpertPlan.md), [OffloadDecision](OffloadDecision.md) and
[SplitPlan](SplitPlan.md) all price the masks at the size it chose
([LaunchCostInput](LaunchCostInput.md) forwards `batch.microBatch`).

## Why

The masks shrink in step with the micro-batch, and for these models keeping
everything on one card is worth far more than the micro-batch. Measured
2026-11-20 on Inkling 2 Mini IQ4_NL (q8_0 KV, RTX 5090 + RTX 3090, upstream
b12600):

| launch | decode | prompt (28k tokens) |
|---|---|---|
| 32k, whole on the 5090, `-ub 512` | 67 to 72 tok/s | 552 tok/s |
| 32k, whole on the 5090, `-ub 256` | 68 tok/s | 532 tok/s |
| 64k, whole on the 5090, `-ub 512` (card full) | 37 to 45 tok/s | not run |
| 64k, whole on the 5090, `-ub 256` | 63 tok/s | 509 tok/s |
| 64k, whole on the 5090, `-ub 128` | 65 tok/s | 483 tok/s |
| 32k, two-card layer split | 15 to 21 tok/s | not run |
| 98k, two-card layer split, `-ub 128` | 26 tok/s | not run |

So a step down costs a few percent of prompt speed and nothing on replies,
while a split across cards costs most of the decode speed: llama.cpp places a
looped model's weights by stored block and its caches by pass, and the passes
that cross cards grow the compute buffers (10.1 and 4.3 GiB at 98k). The
expert offload (`--cpu-moe --moe-cache-mib`) failed to load this model at 64k
(a 13.3 GiB prompt buffer). For a model that does use the full-size window
cache the step-down is tried before `--swa-full` is given up, because losing
that cache costs prompt reuse on every turn.

Every row above was measured with `--swa-full`, which Inkling 2 Mini no longer
gets ([LoopCoreLayout](LoopCoreLayout.md)`.rewindsByCheckpoint`). Without it
the KV cache at 64k is 1.2 GiB instead of 6.4, so 64k fits the 5090 at the
default micro-batch (about 24.5 GiB) and the step-down starts later.

Not handled: when the model does not fit one card even at 128, the layer
split and the expert offload still plan as for any other model; the split
loads and runs slowly, and the expert offload path was not made to work for
this architecture. A micro-batch the expert cache raises (`-b`/`-ub` 4096)
comes later in argv and wins, with masks eight times the priced size.
