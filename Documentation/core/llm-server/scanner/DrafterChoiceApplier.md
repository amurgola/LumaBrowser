# DrafterChoiceApplier

`core/llm-server/scanner/DrafterChoiceApplier.js`

The last pass of [LlmModelsScanner](../LlmModelsScanner.md).scan: lists every
speculative drafter file in the library and applies the user's per-model choice
([LlmDrafterChoices](../service/LlmDrafterChoices.md)) on top of the grouper's folder
pairing. Because it runs inside the scan, the launch planner, the fit tests and the
Setup rows all see the same drafter.

## Methods

- `apply(models, choices)`: edits the models in place and returns the drafter
  library. Each plain GGUF main model gets `drafterAuto` (the folder pairing) and
  `drafterChoice` (`auto`, `off`, `mtp` or `file`), `drafterChoiceKey` (the STORED
  choice as `LlmDrafterChoices.keyOf`, even when its file is gone, so the chat restart
  check does not loop), `mtpOff` (true for `off`: the planner leaves the MTP head unused)
  and `speculation` (`drafter`, `mtp` or `none`: a drafter file wins over the head).
  `drafter`, `drafterTotalBytes` and `totalBytes` follow the choice. A chosen file that is no longer in the library
  leaves the pairing in place and sets `drafterChoiceMissing` to the stale path.
- `library(models)`: `[{ path, name, sizeBytes, modifiedAt, architecture, blockSize,
  relativeDirectory, pairedWith }]`, sorted by name: drafters the grouper paired
  (`pairedWith` holds the models' name keys) and lone ones it listed as `draft`
  weights (block size from their header). Reflects the folder pairing, not the
  choices.

Lone drafters, embedding models, MLX directories and add-ons never take a drafter.

## Globals

None.
