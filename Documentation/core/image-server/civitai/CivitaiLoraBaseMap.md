# CivitaiLoraBaseMap

`core/image-server/civitai/CivitaiLoraBaseMap.js`

Maps the `baseModel` of a CivitAI LoRA version onto the LoRA base it was trained for: a [LoraBaseDetector](../models/LoraBaseDetector.md) base id, which names the image model families the LoRA fits. This is what files a CivitAI LoRA under an architecture, so the LoRA dialog offers it to the models it can run on.

## Methods

- `CivitaiLoraBaseMap.resolve(baseModel)` `{ supported, baseModel, base, label, families, reason, note }`. `base` is the detector id (`sdxl`, `flux`, `wan-video` ...), `label` its name and `families` a copy of its family list. A base that is not in `BASES` (or a version without one) answers `supported: false`, `reason: NO_FAMILY` and a sentence: `<base> LoRAs fit no image model family LumaBrowser runs.`
- `baseModels()` every mapped CivitAI base name (the "installable bases" of a LoRA search in [CivitaiBrowser](CivitaiBrowser.md)).
- `baseModelsForFamily(family)` the CivitAI bases whose LoRAs fit a model of that family (the "Fits this model" search); empty for a family CivitAI has no base for.
- `BASES` the table, CivitAI's `/enums` `BaseModel` names as of 2026-11-18.

## The table

| CivitAI base | LoRA base | Families |
| --- | --- | --- |
| SD 1.4, SD 1.5, SD 1.5 LCM, SD 1.5 Hyper | `sd-1-5` | sd-1-5 |
| SDXL 0.9 / 1.0 / LCM / Lightning / Hyper / Turbo / Distilled, Illustrious, NoobAI, Pony | `sdxl` | sdxl |
| Flux.1 S, Flux.1 D, Flux.1 Krea | `flux` | flux, chroma |
| Flux.1 Kontext | `flux-kontext` | flux-kontext, flux |
| Chroma | `chroma` | chroma, flux |
| Flux.2 D, Flux.2 Klein 4B / 9B (and -base) | `flux2` | flux2 |
| Flux.3, Flux.3 Klein (and -base) | `flux3` | flux3 |
| Qwen | `qwen-image` | qwen-image-edit |
| Qwen 2.1 | `qwen-image-2-1` | qwen-image-2 |
| ZImageTurbo, ZImageBase | `z-image` | z-image |
| Krea 2, Krea 2 Turbo | `krea2` | krea2 |
| Anima | `anima` | anima |
| MOSS Image | `moss-image` | moss-image |
| Wan Video (1.3B, 14B t2v / i2v, 2.2 TI2V-5B / I2V-A14B / T2V-A14B) | `wan-video` | wan-video |
| MiniMax H3 | `minimax-h3` | minimax-h3 |
| MiniMax H3 Image | `minimax-h3-image` | minimax-h3-image |

## Why

- It is separate from [CivitaiBaseMap](CivitaiBaseMap.md) because the two answer different questions. That map says which checkpoints can be imported and with which defaults; a LoRA only needs a model family to exist, so families that run from curated catalog rows alone (FLUX.2, Z-Image, Krea 2, Wan video) take LoRAs although their checkpoints cannot be imported from CivitAI.
- The families come from LoraBaseDetector so a listed LoRA and a hand-dropped one are filed by the same table.
- Unlisted bases are refused, never guessed: SD 2.x (its checkpoints share the `sd-1-5` family, but its LoRAs do not fit SD 1.5), SD 3.x, Qwen 2 and 3, Wan 2.5 and later, LTXV and every architecture the runtimes do not load.

## Limits

A family is coarser than real compatibility. FLUX.2 dev, klein 4B and klein 9B share the `flux2` family but not each other's LoRAs, and Wan 2.1 and 2.2 share `wan-video`. A LoRA offered "for this model" is of the right architecture line, not guaranteed for that exact checkpoint.
