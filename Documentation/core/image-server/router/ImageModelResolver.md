# ImageModelResolver

`core/image-server/router/ImageModelResolver.js`

Looks up installed image model records by id for the image router and locates
the shared LoRA library.

## Methods

- `new ImageModelResolver({ imageServerService, scanner? })`; `scanner`
  defaults to a new [ImageModelsScanner](../ImageModelsScanner.md).
- `resolve(id)` scans `getModelsDirConfig().effectivePath` and resolves the
  record with that id, or `null`.
- `lorasDir()` returns `<modelsDir>/loras` (what `--lora-model-dir` points at),
  or `null` when the models dir cannot be read.
- `ImageModelResolver.stripLocal(ref)` drops the chat's `local::` prefix;
  non-strings give `null`.
- `ImageModelResolver.idFor(modelRef, fallbackId)` is the stripped ref, else the
  fallback, else `null`.

## Why

Every lookup rescans the directory, as legacy did, so a model installed or
removed while the app runs is seen on the next request.
