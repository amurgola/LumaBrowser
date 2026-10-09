# AnimaCatalogEntries

`extensions/anima-model/AnimaCatalogEntries.js`

The Anima image-catalog rows contributed by the `anima-model` add-on, and
their registration into `context.imageCatalog`
([ImageCatalogSurface](../../core/shell/extensions/ImageCatalogSurface.md)).

## Methods

- `AnimaCatalogEntries.BASE` row `anima`: 896x1152, 25 steps, CFG 4,
  `dpm++2m` + `sgm_uniform`, EasyCache launch args (`threshold=0.2`).
- `AnimaCatalogEntries.TURBO` row `anima-turbo`: the official few-step distill,
  10 steps, CFG 1, `euler`, no launch args.
- Both: family `anima`, kind `generate`, non-commercial `licenseNote`,
  `minVramBytes` 6 GB, protocol `sd-cpp-http`, runtimes cuda12/vulkan/cpu, the
  model card's quality-tag `promptPrefix` / `negativePrompt`, and the same VAE
  and Qwen3-0.6B text encoder files. The diffusion file carries
  `loaderFlag: '--diffusion-model'` (UNet-only; without it sd-server would get
  `-m` and fail to load the separate VAE and encoder).
- `all()` both rows; `registerInto(catalog)` registers them, skipping a
  missing catalog or one without `register`.

## Entry files

- `manifest.js`: id `anima-model`, `private: true`, `distributable: true`
  (ships as a standalone add-on zip), no dependencies. It has no core
  requires, so the distributable core-require rule does not apply.
- `main.js`: `activate(context)` -> `registerInto(context.imageCatalog)`,
  resolves `{}`; `deactivate()` nothing (ExtensionTeardown removes the rows).

## Notes

The install-time model manifest snapshots `defaults` and wins over the
catalog, so recipe edits reach fresh installs only; catalog `launchArgs` do
win over the manifest copy, so EasyCache reaches existing installs.
