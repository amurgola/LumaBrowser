# ImagePinTarget

`core/image-server/rampin/ImagePinTarget.js`

The image side of dynamic RAM pinning: resolves the default generate and edit
models into the file list [RamPinService](../../shared/runtime/rampin/RamPinService.md)
locks (its `resolveTarget`).

## Methods

- `new ImagePinTarget({ scanner })`; `scanner` defaults to a new
  [ImageModelsScanner](../ImageModelsScanner.md).
- `resolve(imageServerService)` reads `getDefaults()` (`modelId`, `editModelId`)
  and `getModelsDirConfig().effectivePath`, and resolves
  `{ key, modelName, totalBytes, files: [{ path, sizeBytes }] }`:
  - `files` every component of both models (diffusion, high-noise unet, vae,
    text encoders, vision towers), deduped by path, scanner `bytes` -> `sizeBytes`;
  - `key` the sorted ids joined by `+`, so swapping generate and edit is not a repin;
  - `modelName` labels (else name, else id) joined by ` + `.
- Errors resolve `{ error }`: `No default image model is selected.`,
  `Image model scan failed: <reason>`,
  `Default image model "<id>" no longer matches a scanned model.`,
  `The default image model has no files on disk.`

## Why

It uses the same scan and id lookup as a launch, so the pin covers exactly what
sd-server will read. The video default is deliberately not pinned: video models
are the largest by far, live on their own supervisor outside the LLM and image
singularity swap, and would routinely push the combined pin past the RAM fit
gate, refusing everything instead of speeding up the common loop.
