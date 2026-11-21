# OffloadDecision

`core/llm-server/server/launch/OffloadDecision.js`

The layer-offload decision for one launch.

## Methods

- `OffloadDecision.resolve(state)` returns `{ swaLayout, headerEstimatedBytesSwaFull, headerEstimatedBytesIswa, swaFullAffordable, headerEstimatedBytes, measuredVramBytes, modelEstimatedBytes, fullOffload, softHeadroom, singleGpuFits, swaFull, partial, ngl }`.
  1. Price the full offload with `--swa-full` and, for an SWA model, without it
     (the no-header 1.2x fallback otherwise); `--swa-full` is affordable only when
     its own price fits the budget, and never for a model that rewinds by
     checkpoint (`swaFullUseless`, an SWA model with a loop core, see
     [LoopCoreLayout](LoopCoreLayout.md)`.rewindsByCheckpoint`): the full-size
     cache brings such a model no prompt reuse and reads prompts 2.4 times
     slower.
  2. A positive `overrides.measuredVramBytes` replaces the estimate.
  3. `fullOffload` when VRAM exists and the estimate fits the budget's
     `fullOffloadRoomBytes` (on one card, down to the soft reserve); `softHeadroom`
     when that fit needed more than `vramAvailableBytes` (never for a measured
     unified-memory fit; `--swa-full` stays priced against the strict room); `singleGpuFits` when
     it also fits the largest card on a multi-card box; `swaFull` when it is
     affordable, accepted and the model has a window layout.
  4. `ngl`: `ALL_LAYERS` (999) on a full offload, a [PartialOffloadSizer](PartialOffloadSizer.md)
     split when a header exists and VRAM exceeds the 512 MiB fixed cost, else 0.
- `ALL_LAYERS` (999).

## Why

`--swa-full` caches the full context on every windowed layer so multi-turn prompt
reuse works, which on a Gemma-class model at 128k alone is tens of GB: a speed
flag must never be what pushes layers off the GPU. A fit test's measured peak sees
quantization padding and allocator behaviour the header cannot, so it drives the
fit call; the partial split keeps the header estimate. Without a header there is
no safe way to size a partial split, so the plan goes all-or-nothing. A whole model
on one card may use half the GPU headroom before any layer leaves it, because layers on
the CPU cost far more speed than the missing margin
([GpuHeadroom](../../../shared/runtime/GpuHeadroom.md)).

## Expert hold-back and stale measurements (2026-11-20)

- `_price(state, swaFull)`: an expert offload's price is
  [FullOffloadCost](FullOffloadCost.md) without the context scratch plus
  [MoeExpertPlan](MoeExpertPlan.md)`.heldBackBytes`; every other launch is
  priced with the scratch.
- `fitShape` ([FitShape](FitShape.md)`.of`) and `measuredStale`: a measured
  peak that arrives with `overrides.measuredShape` is dropped unless that
  shape is this launch's, and the header estimate stands.
