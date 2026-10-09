# ImageModelPicker

`core/shared/ImageModelPicker.js`

Picks the best generate-kind image model that fits one GPU card, quality first.

## Methods

- `ImageModelPicker.cardBudgetBytesFromHw(hw)` returns the spendable image
  budget: the largest single `hw.gpus[].maxBytes` (per-adapter budgets with the
  compositor reserve already subtracted), falling back to `hw.usableVramBytes`
  only when there is no per-card list. Returns 0 at or below `MIN_GPU_BYTES`
  (1.5 GB) and for null hardware.
- `ImageModelPicker.pickImageModel(imageModels, { cardBudgetBytes })` returns
  `{ model, offload: false }` for the first `IMAGE_RANK` model whose
  `minVramBytes + IMAGE_HEADROOM` fits, else `{ model, offload: true }` for the
  lightest ranked model (or the first generate model if none is ranked), else
  `null`. Edit-kind models are never picked. Throws `TypeError` if the second
  argument is a bare number.
- Constants: `IMAGE_RANK` (`flux-1-schnell`, `z-image-turbo`, `sd-1-5`),
  `IMAGE_HEADROOM` (2 GB), `MIN_GPU_BYTES` (1.5 GB), `GB`.

## Why one card

sd.cpp cannot shard an image model across GPUs (which is why
`VramCoordinator.reserve` passes `allowSplit: false` for image roles), so the
only budget an image model can spend is one card. The option is named
`cardBudgetBytes`, not `vramBudget`, as a guard rail: a whole-box total
(diagnostics sums every adapter) is not a budget. Bug M18 was exactly that: the
first-run wizard budgeted ~80 GB on a 32+24+24 rig and could pick a model that
fits no card. A bare number is rejected loudly for the same reason.

`IMAGE_HEADROOM` mirrors ImageServerService's reserve (base + 2 GB) so this
answer matches what the coordinator reserves at launch. When nothing fits,
sd.cpp's `--offload-to-cpu` streams weights from RAM, so the caller shows a
speed warning instead of refusing.

## Renderer duplicate

The renderer's [ImageModelBudget](../llm-server/ui/js/setup/ImageModelBudget.md) keeps a deliberate copy of this ranking because renderer modules served over the locked-down `/llm-ui/` mount cannot require this file.

## Admission note

The only main-process consumer is `core/llm-server/models/autoPlanner.js`, so by
the `core/shared` README admission test (two subsystems) this fails test 1 and
belongs in `core/llm-server/models/` (or `core/image-server/`). Ported at its
legacy location; move it when autoPlanner is ported.
