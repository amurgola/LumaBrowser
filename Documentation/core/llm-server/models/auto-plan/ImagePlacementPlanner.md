# ImagePlacementPlanner

`core/llm-server/models/auto-plan/ImagePlacementPlanner.js`

Decides how the chat and image models share the GPUs for
[AutoPlanner](../AutoPlanner.md), possibly trading the chat pick.

## Methods

- `new ImagePlacementPlanner({ machine, llmModels, image, cpuMoeSupported = true })`.
- `decide(llmPick)` returns `{ llmPick, placement }`:
  - no image or no GPU: `none`;
  - the pick budgets no VRAM (CPU/partial): `fcfs`;
  - it [coexists](CoexistencePicker.md) with `image.minVramBytes + 2 GB`: `coexist`;
  - otherwise the trade-off below; nothing qualifies: `fcfs`.
- `ImagePlacementPlanner.unplaced(kind)` is `{ kind, card: null, layout: null }`.

## The trade-off

Two families, each scored by `AutoPlanRanking.modelScore` with ties to coexist:

- fully resident (only when the pick was `gpu`): shrink to coexist, or keep the
  biggest pick that fits the largest card and swap;
- expert offload (when supported): a sparse pick small enough to coexist, or one
  sized to the largest card and swapped.

The resident winner stands unless it is below `large` and the offload winner
out-tiers it. Shrinking has a floor: `min(original, max(mid, original - 1))`, so
coexisting never costs two tiers or a `small` model. A swap needs a CUDA card and
must pass [HotswapRamGate](../../../shared/runtime/HotswapRamGate.md) for
`[llm weights, image bytes]`, without the in-flight copy for a cpu-moe pick (its
weights stay in RAM; a swap only re-uploads the resident share). A swap writes
`PlacementLayout.singularityLayout(largestCudaCard.index)`.

## Why

Without the offload family a 24 GB card was shrunk to a mid model to coexist
while a 16 GB card (cpu-moe from the start) kept an xl one.
