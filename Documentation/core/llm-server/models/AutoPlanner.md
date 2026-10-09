# AutoPlanner

`core/llm-server/models/AutoPlanner.js`

The question-free "Automatic Local Setup" planner. One call turns detected
hardware plus "images too? music too?" into a complete install plan: the chat
model, the image model, the music model, and how they share the GPUs. Pure:
plain data in, plain data out; all I/O stays with the caller.

## Methods

- `new AutoPlanner().plan(args)` with
  `{ hw, devices?, wantImage, wantMusic?, llmModels, imageModels?, musicModels?, musicEligibility?, cpuMoeSupported = true }`:
  - `hw`: a [HwBudget](HwBudget.md) result; `devices`: CUDA rows
    `{ index, totalBytes }` (empty on non-CUDA hosts, which never get a swap pool);
  - `llmModels`: [CuratedModelCatalog](CuratedModelCatalog.md)`.MODELS` shape;
  - `musicEligibility.wslReady`: `false` only when known missing (Windows
    without WSL2 and the NVIDIA WSL driver).

  Returns `{ llm, image, music, musicSkippedReason, placement, tier, summary, ramPin }`:
  - `llm`: [LlmRecommendation](auto-plan/LlmRecommendation.md);
  - `image`: `{ modelId, label, approxTotalBytes, minVramBytes, offload }` or null;
  - `music`: see [MusicLegPlanner](auto-plan/MusicLegPlanner.md);
  - `placement`: `{ kind: 'none'|'coexist'|'singularity'|'fcfs', card, layout }`
    where a singularity carries a v2 [PlacementLayout](../../shared/runtime/PlacementLayout.md);
  - `tier`: the [HardwareTiers](../../shared/HardwareTiers.md) row;
  - `summary`: plain-language lines ([PlanSummary](auto-plan/PlanSummary.md));
  - `ramPin`: [RamPinAdvice](auto-plan/RamPinAdvice.md).

  When no catalog model fits at all it returns
  `{ llm: null, image: null, music: null, placement: { kind: 'none' }, tier, summary: ['No model in the catalog fits this machine.'] }`.

## Flow

1. [AutoPlanMachine](auto-plan/AutoPlanMachine.md) reduces the hardware to budgets.
2. [LlmTierPicker](auto-plan/LlmTierPicker.md) picks the chat model through four tiers.
3. The image model is ranked against the biggest single card
   ([ImageModelPicker](../../shared/ImageModelPicker.md)); sd.cpp cannot shard.
4. [MusicLegPlanner](auto-plan/MusicLegPlanner.md) decides if music can run.
5. [ImagePlacementPlanner](auto-plan/ImagePlacementPlanner.md) decides coexist,
   swap pool or first-come, possibly trading the chat pick.
6. Music joins the pool when it has no other card.
7. RAM pin advice, the recommendation and the summary are built from the final pick.

## Why

A swap pool beats streaming weights from system RAM, so when the two models
cannot coexist in VRAM the planner writes a singularity rather than shrinking
chat below the shrink floor. Every number (ladders, headroom, the 0.15 MoE
resident fraction) was verified identical to legacy over 18,578 plans: the
legacy fixtures, every GpuRigs rig at 11 RAM sizes, 3 RAM bandwidths and 2 CUDA
versions, with and without images, music, WSL and cpu-moe support, on both the
legacy and the ported catalogs.
