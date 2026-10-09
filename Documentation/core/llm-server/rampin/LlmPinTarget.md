# LlmPinTarget

`core/llm-server/rampin/LlmPinTarget.js`

The LLM side of dynamic RAM pinning: resolves the default chat model into the
file list [RamPinService](../../shared/runtime/rampin/RamPinService.md) locks
(its `resolveTarget`). The image twin is [ImagePinTarget](../../image-server/rampin/ImagePinTarget.md).

## Methods

- `new LlmPinTarget({ scanner })`; `scanner` defaults to `LlmModelsScanner.shared`.
- `resolve(llmServerService)` reads `getDefaults().modelPath` and
  `getModelsDirConfig().effectivePath`, finds the scanned model whose
  `weights[0].path` is the default, and resolves
  `{ key: modelPath, modelName: displayName || name, totalBytes, files: [{ path, sizeBytes }] }`:
  - `files` every entry with a path in `weights`, `mmproj`, `drafter`, `mtp`
    (in that order, `LlmPinTarget.FILE_GROUPS`), missing sizes as 0;
  - `totalBytes` the model's `totalBytes`, else the file sum.
- Errors resolve `{ error }`: `No default model is selected.`,
  `Model scan failed: <reason>`,
  `The default model path no longer matches a scanned model.`,
  `<name> is not a GGUF model, so it cannot be pinned.` (MLX and add-on kinds),
  `The default model has no weight files on disk.` (defensive; the lookup
  already requires a weights path).

## Why

It uses the same scan and `weights[0].path` lookup as a launch, so the pin
covers exactly what Start loads, sidecars included. An MLX model is a directory
of shards the Mac-only runtime owns and is not pinned.
