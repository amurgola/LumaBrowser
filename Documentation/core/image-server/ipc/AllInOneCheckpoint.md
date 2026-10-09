# AllInOneCheckpoint

`core/image-server/ipc/AllInOneCheckpoint.js`

Tells an all-in-one SD / SDXL checkpoint apart from an Anima split UNet by its `.safetensors` header.

## Methods

- `AllInOneCheckpoint.hasBakedVaeOrClip(filePath)` true when a tensor name starts with `first_stage_model.` (baked VAE), `cond_stage_model.` (SD1.x CLIP) or `conditioner.` (SDXL dual CLIP). Non-safetensors, unreadable or corrupt files answer false.
- `AllInOneCheckpoint.ANIMA_ERROR` the refusal text.

## Why

The Anima import forces `--diffusion-model` and adds the external Qwen VAE and encoder; doing that to an all-in-one file makes sd-server detect SD/SDXL and reject the mismatched VAE. The sniff is best effort so it never blocks a legitimate import.
