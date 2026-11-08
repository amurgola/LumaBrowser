# ModelFiles

`core/llm-server/server/launch/ModelFiles.js`

The files and facts of one scanned llama.cpp model a launch needs.

## Methods

- `new ModelFiles(model)` exposes `name`, `modelPath` (`weights[0].path`),
  `modelBytes`, `mmprojPath`/`mmprojBytes`, `drafterPath`/`drafterBytes`,
  `mtpGrafted`, `mtpHeadOnDisk`, `mtpHeadPath`, `mtpHeadBytes`, `mtpCapable`,
  `gguf` (the parsed header, or null when unparsed or without blocks), `rawGguf`
  and `family` ([ModelFamilies](../ModelFamilies.md)`.detect`). Byte counts are
  numbers, 0 when missing.

## Why

Two MTP conventions exist: the head grafted into every quant (llama.cpp finds it
in the main GGUF) or published once as its own ~1.4 GB file that `-md` must point
at (unsloth/Qwen3.8-27B-GGUF). Both shapes ship in the same repo, so a detached
head is used only when the weights do not already carry one: passing `-md` to a
grafted model loads a second copy of the same tensors. `mtpGrafted` is the tensor
scan's verdict; when the scan could not run, a paired head file is the only
evidence and is used.

## Drafter block size

`drafterBlockSize` is the paired drafter header block (`model.drafter[0].blockSize`,
DFlash2 8, DSpine 16), or null when the scanner had no header for it; floored and
ignored below 2. [SpeculationPlan](SpeculationPlan.md) and [FamilyTuning](FamilyTuning.md)
hand it to `ModelFamilies.speculativeArgs`.

## Drafter choice

`mtpCapable` is false when the scan's [DrafterChoiceApplier](../../scanner/DrafterChoiceApplier.md)
set `mtpOff` (the Drafter dialog's "None"), so the planner leaves a built-in head unused.
`drafterChoiceKey` (default `auto`) is the saved choice the launch ran under.
