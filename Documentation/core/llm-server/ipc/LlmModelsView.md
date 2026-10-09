# LlmModelsView

`core/llm-server/ipc/LlmModelsView.js`

The LLM Setup models view.

## Methods

- `new LlmModelsView({ llmServerService, scanner?, freeSpace? })` (defaults
  `LlmModelsScanner.shared`, `ModelsDirStorage.freeSpace`).
- `view()` resolves `{ config, scan, descriptors }` for the configured folder.
- `setModelsDir(dir)` saves the folder (blank resets it) and returns the same view.
- `scan(dir)` a decorated scan of `dir`.
- `decorate(scan)` sets `nameKey` and `displayName` (the service's resolver) on
  every model; an unavailable scan is returned as is.
- `storageInfo()` resolves `{ config, freeBytes, totalBytes }`.
- `LlmModelsView.nameKeyOf(model)` the weights file stem (`ModelName.key`), or the
  scan name for a weights-less entry.
- `LlmModelsView.descriptors(scan)` `ModelDescriptor.toLlmDescriptor` per model.

## Why

The Setup list and Defaults dropdown must show the same name the chat picker
does; `nameKey` is the stable key the rename UI writes back. A weights-less
entry's name is already extensionless, so a dotted stem (`...-v0.2`) is not cut.
