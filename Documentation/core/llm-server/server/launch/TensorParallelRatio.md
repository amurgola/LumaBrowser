# TensorParallelRatio

`core/llm-server/server/launch/TensorParallelRatio.js`

The `--tensor-split` ratio for tensor-parallel mode.

## Methods

- `TensorParallelRatio.compute(perGpu)` returns comma-joined integer percentages
  (each at least 1) weighted by published bandwidth
  ([MemoryBandwidth](../../MemoryBandwidth.md)`.tableGpuBandwidth`), or by total
  VRAM when any card is unknown; `null` for fewer than two cards.

## Why

Tensor-parallel decode is bandwidth bound, so each card holds a share of every
tensor proportional to its bandwidth and finishes in step: a 5090 + 3090 lands
66/34, matching the field-tuned 70/30. Unknown cards switch the whole ratio to
capacity rather than mixing a class-floor guess into it.
