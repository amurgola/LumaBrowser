# ImportBases

`core/image-server/ipc/ImportBases.js`

The base architectures a custom checkpoint can be imported as, with the defaults, VRAM floor and launch flags each gets (mirroring the curated rows of the same base).

## Methods

- `ImportBases.BASES` `sd-1-5`, `sdxl`, `flux`, `qwen-image-edit`, `qwen-image-2-1`, `anima`: `{ family, kind, defaults, minVramBytes, launchArgs?, supportsEdit?, constraints?, licenseNote? }`.
- `ImportBases.get(baseType)` (own entries only, else null), `names()`, `isSplitDiffusion(baseType)`.
- `SPLIT_DIFFUSION` (`qwen-image-edit`, `qwen-image-2-1`, `anima`: always `--diffusion-model`), `QWEN_COMPANION_BASES`, `COMPATIBLE_RUNTIMES`.

## Why

The comments on each base record why its values are what they are (Flux cfg 1, no sd.cpp "beta" scheduler, pre-baked q4_K GGUF for Rapid AIO, Anima's required quality tags).
