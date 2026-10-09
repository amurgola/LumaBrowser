# ImageSetup

`core/llm-server/ui/js/setup/ImageSetup.js`

The image-server [setup pipeline](SetupPipeline.md).

## Methods

- `ImageSetup.run(api, { runtime, model?, found?, ...hooks })`; `api` is
  `llmDiagAPI.image`-shaped (`installRuntime`, `downloadModel`, `setDefaults`,
  `setEnabled`, `startServer`, `onRuntimeEvent`, `onModelEvent`, plus
  `importExistingModel` when `found` is used). Fails early without a runtime and
  a model or found checkpoint.
  1. Installs `runtime` unless `runtime.installed` (companion downloads are
     labelled "Companion · ").
  2. Either links `found` (`importExistingModel({ sourcePath, name,
     promptStyle })`; the returned id becomes the default; no bytes move) or
     downloads `model.id` with "File n of m · role" sub-lines.
  3. Saves `{ runtimeId, modelId }`, enables the tab (best effort) and starts the
     server.
  Resolves `{ ok: true, modelId, imported }`. Fallback message: "Image setup failed".

## Globals

None.
