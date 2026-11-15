# AnimaCatalogEntries

`extensions/anima-model/AnimaCatalogEntries.js`

The Anima image-catalog rows contributed by the `anima-model` add-on, and
their registration into `context.imageCatalog`
([ImageCatalogSurface](../../core/shell/extensions/ImageCatalogSurface.md)).

## Methods

- `AnimaCatalogEntries.BASE` row `anima`: 896x1152, 25 steps, CFG 4,
  `dpm++2m` + `sgm_uniform`, no launch args (no step cache, see Notes).
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

- `manifest.js`: id `anima-model`, `distributable: true`
  (ships as a standalone add-on zip), no dependencies. It has no core
  requires, so the distributable core-require rule does not apply.
- `main.js`: `activate(context)` -> `registerInto(context.imageCatalog)`,
  resolves `{}`; `deactivate()` nothing (ExtensionTeardown removes the rows).

## Notes

The install-time model manifest snapshots `defaults` and wins over the
catalog, so recipe edits reach fresh installs only; catalog `launchArgs` do
win over the manifest copy, so a launch-arg change reaches existing installs.

The base row carried `--cache-mode easycache --cache-option threshold=0.2`
until add-on 1.0.1. On sd.cpp master-973 (luma-b3) and master-1088 (luma-b4)
that threshold skips 13 of 25 steps and the render comes out soft and
speckled ("dusty"); the same seed without the cache is clean. Measured
2026-11-14 on the 5090 at 896x1152: 8.1 s cached against 15.2 s clean. A
threshold that stays clean (0.025) skips 0 to 4 steps depending on the scene,
so the cache was removed instead of retuned. Two other levers were tried the
same day and neither is clean: an earlier cutoff (`threshold=0.2,end=0.6`,
6 to 7 steps skipped, about 10 s) removes most of the speckle but stays
visibly softer than the plain render, and `euler` with the cache is as
speckled as `dpm++2m`, so the sampler is not the cause. Others report the
same on this model: several users in the Anima model card discussion "Works
great with CacheDit" get "very noisy" output from step caching, and the sd.cpp
EasyCache PR (#940) notes added noise on some models when late steps are
skipped. MOSS-Image keeps its EasyCache default; the same check there showed
no speckle (see ImageModelEntries). The packaged app loads the
sideloaded copy of this add-on, so the fix needs the manifest version bump to
be offered as an update.
