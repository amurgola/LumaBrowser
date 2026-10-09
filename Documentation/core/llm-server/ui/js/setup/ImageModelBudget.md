# ImageModelBudget

`core/llm-server/ui/js/setup/ImageModelBudget.js`

The setup wizards' quality-first image model pick against ONE card's memory.

## Methods

- `ImageModelBudget.cardBudgetBytes(hw)`: the largest `hw.gpus[].maxBytes`, the
  total `usableVramBytes` only when there is no per-card list, and 0 at or below
  `MIN_GPU_BYTES` (1.5 GB) or for null hardware.
- `ImageModelBudget.pickImageModel(catalog, hw)`: among generate-kind models, the
  first of `IMAGE_RANK` (`flux-1-schnell`, `z-image-turbo`, `sd-1-5`) whose
  `minVramBytes + IMAGE_HEADROOM` (2 GB) fits the card budget; else the lightest
  ranked model (sd.cpp streams it from RAM); else the first generate model; else
  `null`.

## Renderer twin of ImageModelPicker

sd.cpp cannot shard an image model across GPUs, so a summed whole-box VRAM
figure is never a budget (bug M18: a 32+24+24 rig was budgeted about 80 GB). The
main process has the same rule in [ImageModelPicker](../../../../shared/ImageModelPicker.md);
the renderer cannot require it, so `ImageModelBudget.test.js` runs one behaviour
table against both and checks their constants match (the conformance test that
doc asked the setup-engine porter to re-create).

## Globals

None.
