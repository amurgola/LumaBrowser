# ImageModelsView

`core/image-server/ipc/ImageModelsView.js`

The Image Setup models view (folder config, scan with display names, shared descriptors), the catalog view, and moving a model between the Generation, Edit and Video areas.

## Methods

- `new ImageModelsView({ imageServerService, scanner?, catalog? })`.
- `view()` / `setModelsDir(dir)` resolve `{ config, scan, descriptors }`; each scanned model gets `displayName = service.resolveModelDisplayName(id)`; an empty dir resets to the default.
- `setKind(modelId, kind)` (`edit` / `generate` / `video`) writes `kind` (and a missing `id`) onto the model's manifest, creating it if needed, and resolves a fresh view. Refusals throw `modelId is required.`, `kind must be "edit", "generate", or "video".`, `Model "<id>" not found.`.
- `catalogView()` `{ models, descriptors }` (descriptors without the installed overlay, which the renderer applies).
- `ImageModelsView.descriptors(scan)` installed-model descriptors (`ModelDescriptor.toImageInstalledDescriptor`).

## LoRA trainable tag

Models covered by a recipe in [ImageTrainingRegistry](../models/ImageTrainingRegistry.md)
come back from `view()` and `catalogView()` as copies carrying `loraTrainable` (the recipe
label); catalog rows themselves are never mutated. The constructor takes `training` as a
test seam.
