# CivitaiBaseMap

`core/image-server/civitai/CivitaiBaseMap.js`

Maps CivitAI's vocabulary onto LumaBrowser's: a version's `baseModel` string to the import base, prompt profile and few-step recipe a checkpoint should land with (or the reason it cannot be installed), and a model `type` to the asset kind the app files it under.

## Methods

- `CivitaiBaseMap.resolve(baseModel)` `{ supported, baseModel, baseType, family, kind, profile, recipe, defaults, reason, note }`. For an importable base, `defaults` is the [ImportBases](../ipc/ImportBases.md) defaults with the [ImagePromptProfiles](../prompt/ImagePromptProfiles.md) patch and then the recipe applied, so a distilled variant's steps and cfg win. Unsupported bases answer `supported: false` with a `reason` code and a `note` sentence for the UI; video bases also carry `kind: 'video'`, the catalog `family` (`wan-video`, `ltx-video`, `minimax-h3`, or `null`) and `supportsI2V`.
- `isImportable(baseModel)`, `importableBaseModels()`, `baseModelsFor(baseType)` (the CivitAI names behind one import base, for a "what can I install" filter).
- `assetKind(modelType)` `checkpoint`, `lora` (LORA, LoCon, DoRA), `vae`, `embedding` (TextualInversion), `upscaler`, `controlnet`, else `null`. `isInstallableType(modelType)` is true for the kinds the app installs today (`INSTALLABLE_KINDS`: checkpoint, lora).
- Tables: `IMPORTABLE`, `NO_BASE_YET`, `UNSUPPORTED`, `VIDEO`, `HOSTED_SERVICES`, `ASSET_KINDS`; reason codes `NO_BASE`, `UNSUPPORTED_ARCH`, `HOSTED`, `VIDEO_PENDING`, `UNKNOWN`.

## The table

| CivitAI baseModel | Import base | Profile | Recipe |
|---|---|---|---|
| SD 1.4, SD 1.5, SD 2.0, SD 2.1 | sd-1-5 | sd-1-5-generic | 768 px for the `768` variants |
| SD 1.5 LCM, SDXL 1.0 LCM | sd-1-5 / sdxl | generic | 8 steps, cfg 1.5, `lcm` |
| SD 1.5 Hyper, SDXL Hyper | sd-1-5 / sdxl | generic | 8 steps, cfg 1 |
| SDXL 0.9, SDXL 1.0, SDXL Distilled | sdxl | sdxl-generic | |
| SDXL Lightning | sdxl | sdxl-generic | 8 steps, cfg 1.5, `euler_a` + `sgm_uniform` |
| SDXL Turbo | sdxl | sdxl-generic | 4 steps, cfg 1, 512 px |
| Illustrious, NoobAI | sdxl | sdxl-illustrious | |
| Pony | sdxl | sdxl-pony | |
| Flux.1 D, Flux.1 Krea | flux | | |
| Flux.1 S | flux | | 4 steps |
| Flux.1 Kontext | flux (`kind: edit`) | | |
| Chroma | flux (`family: chroma`) | | 26 steps, cfg 4, `euler` |
| Qwen | qwen-image-edit | | |
| Qwen 2.1 | qwen-image-2-1 | | |
| Anima | anima | | |

Names are CivitAI's `/enums` `BaseModel` values as of 2026-11-04, matched after trimming and case-sensitively; an unlisted name is `UNKNOWN`, never guessed.

## Why

- Pony V7 is AuraFlow-based, not SDXL, so it sits in `UNSUPPORTED`, unlike Pony (V6).
- CivitAI files Qwen-Image and Qwen-Image-Edit 2509/2511 under one `Qwen` name; both run on the 2509 companion set, which is what the `qwen-image-edit` base links in ([ImportCompanions](../ipc/ImportCompanions.md)).
- The flux base still refuses single-file `.safetensors` ([ImportedEntryBuilder](../ipc/ImportedEntryBuilder.md)); mapping Flux names lets the UI explain that and accept GGUF UNets.
- Flux.2 klein, MOSS, Z-Image, SD 3.x and the Wan image model are weights the catalog or sd.cpp can run but have no import base yet (`NO_BASE`), so the note points at the curated rows; video bases are `VIDEO_PENDING` until the video import lands.
- The distilled recipes are the community values the curated rows already use (Lightning: euler + sgm_uniform at cfg 1 to 2; Turbo: 512 px, 4 steps; LCM: sd.cpp's `lcm` sampler).
