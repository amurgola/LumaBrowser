# CatalogModelInstaller

`core/image-server/ipc/CatalogModelInstaller.js`

Downloads a curated catalog image model, optionally at a chosen diffusion quant, writes its manifest, and attaches the speed LoRA the row recommends.

## Methods

- `new CatalogModelInstaller({ imageServerService, slot, catalog?, loras?, attacher?, loraCatalog? })`; `loras` is the [ImageLoraLibrary](ImageLoraLibrary.md) and `attacher` the [ModelLoraAttacher](ModelLoraAttacher.md) (both wired by `ImageIpcHandlers`); without them a row's recommendation is skipped.
- `install({ id, quant? }, send)` resolves `{ success: true, id, dir }`, `{ success: false, canceled: true }` or a failure. Refusals without an event: `A catalog model id is required.`, `Catalog entry "<id>" has no files.`, the unknown-quant error, and (busy) `An image model download is already in progress.`. Downloads every role into `<modelsDir>/<id>/`, writes `ImageManifestBuilder.forCatalog` quietly; a download failure sends `error`.
  - A row with `recommendedLora: <lora catalog id>` (MiniMax-H3's Turbo) then downloads that LoRA through `loras.download` (once the slot is free again) and `attacher.attach({ id, loras: [{ name }], distilledPreset: true, preset })` with the curated entry's preset. The LoRA's `start` event is re-sent with the model's id so the setup card keeps the progress on the model's row; its `done` and `error` are swallowed. A LoRA failure logs a `console.warn` and leaves the model installed plain.
  - `done { id, dir }` is sent once, after the optional LoRA step.
- `CatalogModelInstaller.downloadList(files, dir)` `[{ role, url, destPath }]` per role; a row with a known `size` or `sha256` (a pinned Hub listing) adds `expectedSize` / `expectedSha256`, which [ImageModelDownload](../models/ImageModelDownload.md) hands to the transfer's verifier.
