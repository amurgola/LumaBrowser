# OffloadDecision

`core/llm-server/server/launch/OffloadDecision.js`

The layer-offload decision for one launch.

## Methods

- `OffloadDecision.resolve(state)` returns `{ swaLayout, headerEstimatedBytesSwaFull, headerEstimatedBytesIswa, swaFullAffordable, headerEstimatedBytes, measuredVramBytes, modelEstimatedBytes, fullOffload, singleGpuFits, swaFull, partial, ngl }`.
  1. Price the full offload with `--swa-full` and, for an SWA model, without it
     (the no-header 1.2x fallback otherwise); `--swa-full` is affordable only when
     its own price fits the budget.
  2. A positive `overrides.measuredVramBytes` replaces the estimate.
  3. `fullOffload` when VRAM exists and the estimate fits; `singleGpuFits` when
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
no safe way to size a partial split, so the plan goes all-or-nothing.
