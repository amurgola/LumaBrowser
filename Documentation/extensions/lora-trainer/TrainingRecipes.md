# TrainingRecipes

`extensions/lora-trainer/TrainingRecipes.js`

One recipe per image family the trainer can reach without a gated download.

## Recipes

| id | families | ai-toolkit arch | trains on |
|---|---|---|---|
| `sdxl` | sdxl | `sdxl` | the installed checkpoint file |
| `sd-1-5` | sd-1-5 | `sd1` | the installed checkpoint file |
| `anima` | anima | `anima` | `circlestone-labs/Anima-Base-v1.0-Diffusers` |
| `z-image` | z-image | `zimage` | `Tongyi-MAI/Z-Image` |
| `flux2-klein-4b` | flux2, model `flux-2-klein-4b` only | `flux2_klein_4b` | `black-forest-labs/FLUX.2-klein-base-4B` |
| `chroma` | chroma | `chroma` | `lodestones/Chroma1-Base` |
| `moss-image` | moss-image | `moss_image:base` | `OpenMOSS-Team/MOSS-Image-Base` |
| `qwen-image-2` | qwen-image-2 | `qwen_image_2` | `Comfy-Org/Qwen-Image-2.1` |
| `minimax-h3-image` | minimax-h3-image | `minimax_h3_image` | `Comfy-Org/MiniMax-H3-Image` |

Each row also carries `captionStyle` (`tags` or `sentence`), default `steps`, `minVramGb`,
and `model` / `train` / `network` / `dataset` / `sample` overrides copied from ai-toolkit's
own defaults for that architecture at the pinned commit.

`GATED` lists the families left out because their training weights are gated on Hugging
Face: flux (schnell and dev), flux-kontext, flux3, krea2 and FLUX.2 klein 9B.

## Methods

- `all()`, `byId(id)`.
- `forModel(model)`: the recipe for `{ id, family }` by the registry's own matching rule.
- `registryEntry(recipe)`: the row stored in [ImageTrainingRegistry](../../core/image-server/models/ImageTrainingRegistry.md).
- `unavailableReason(family)`: why a family has no recipe.

## Notes

The recipes are data taken from ai-toolkit's source, not measured here. SD 1.5 uses arch
`sd1`: the trainer's UI calls it `sd15`, which its Python side does not accept.
