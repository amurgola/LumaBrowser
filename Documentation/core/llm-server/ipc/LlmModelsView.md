# LlmModelsView

`core/llm-server/ipc/LlmModelsView.js`

The LLM Setup models view.

## Methods

- `new LlmModelsView({ llmServerService, scanner?, freeSpace? })` (defaults
  `LlmModelsScanner.shared`, `ModelsDirStorage.freeSpace`).
- `view()` resolves `{ config, scan, descriptors }` for the configured folder.
- `setModelsDir(dir)` saves the folder (blank resets it) and returns the same view.
- `scan(dir)` a decorated scan of `dir`.
- `decorate(scan)` sets `nameKey`, `displayName` (the service's resolver) and
  `drafterOffer` ([DrafterCatalog.offerFor](../models/DrafterCatalog.md), null when
  no drafter is published for the model) on every model, and `grouping`
  ([ModelGrouping.attach](../models/ModelGrouping.md), stored renames from
  `getModelDisplayNames` as variants); an unavailable scan is returned as is.
- `setDrafter({ key, choice })`: saves one model's drafter choice (`'auto'`, `'off'`,
  `'mtp'` (refused on a model without an MTP head) or `{ path }`) and resolves `{ success: true, config, scan, descriptors }`. Refused
  (`{ success: false, error }`) unless the key names a plain GGUF model of a fresh scan
  and a path is a drafter of that same scan, so a renderer can only point a model at a
  drafter file inside the models folder.
- `storageInfo()` resolves `{ config, freeBytes, totalBytes }`.
- `LlmModelsView.nameKeyOf(model)` the weights file stem (`ModelName.key`), or the
  scan name for a weights-less entry.
- `LlmModelsView.descriptors(scan)` `ModelDescriptor.toLlmDescriptor` per model.

## Why

The Setup list and Defaults dropdown must show the same name the chat picker
does; `nameKey` is the stable key the rename UI writes back. A weights-less
entry's name is already extensionless, so a dotted stem (`...-v0.2`) is not cut.
