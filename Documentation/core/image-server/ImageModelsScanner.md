# ImageModelsScanner

`core/image-server/ImageModelsScanner.js`

Scans the image models directory (one subfolder per model) and returns a record
per usable model for the launch planner, the image and video routers, the RAM
pin target and the setup UI.

## Methods

- `new ImageModelsScanner({ catalog? })`; `catalog` (anything with `list()` and
  `getById(id)`) defaults to a new [ImageModelCatalog](models/ImageModelCatalog.md).
- `scan(modelsDir)` resolves:
  - `{ modelsDir: null, models: [] }` for no directory,
  - `{ modelsDir, models: [], missing: true }` when it does not exist,
  - `{ modelsDir, models: [], error }` when it cannot be listed,
  - else `{ modelsDir, models }` in directory order. Loose files, the `loras/`
    LoRA library (any case) and folders without a diffusion file are skipped.
- `readModelDir(dir, name, catalogList?)` resolves one folder's record or `null`.

Layout, as the downloader writes it:

```
<modelsDir>/z-image-turbo/{z_image_turbo-Q3_K.gguf, ae.safetensors, Qwen3-4B...gguf, manifest.json}
<modelsDir>/sd-1-5/{v1-5-pruned-emaonly.safetensors, manifest.json}
```

The id is `manifest.id`, else the folder name. Files come from
[ImageModelFiles](ImageModelFiles.md) (manifest roles, or inferred from names
when there is no manifest); the record from [ImageModelRecord](ImageModelRecord.md).

## Why

Not a [ModelDirectoryScanner](../media-shared/ModelDirectoryScanner.md): that
base is synchronous, returns a sorted bare array and requires `sizeBytes`,
while every image caller awaits an envelope (`missing` / `error` drive the setup
UI) in directory order and reads per-role `bytes`. Forcing it in would change
eight callers' contract for no shared code.

The catalog list is read once per scan for the companion-file update check.
