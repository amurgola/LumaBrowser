# LoraBaseDetector

`core/image-server/models/LoraBaseDetector.js`

Works out which base architecture a LoRA was trained against, from a trainer
metadata string or from tensor-key fingerprints, and maps it onto the image
catalog's `family` strings.

## Methods

- `LoraBaseDetector.fromMetadata(value)` maps a string such as
  `sdxl_base_v1-0`, `Flux.1-dev/lora` or `Qwen-Image-2.1` to a base id, or `null`.
- `LoraBaseDetector.fromKeys(keys)` fingerprints tensor names (both `.` and `_`
  separators, so kohya and diffusers names match alike), or `null`.
- `LoraBaseDetector.BASES` maps each base id to `{ label, families }`.
- `METADATA_RULES` and `KEY_RULES` are the ordered rule tables; the first match wins.

## Bases

`sd-1-5`, `sdxl`, `sd-unet` (ambiguous 1.5 or SDXL), `flux`, `flux-line`
(FLUX.1, Chroma or FLUX.2), `flux2`, `chroma`, `qwen-image` (the 20B line, edit
family), `qwen-image-2-1`, `z-image`, `krea2` (a family contributed by an
extension), `wan-video`, `minimax-h3`.

## Why

- Qwen-Image 2.1 is a new 7B single-stream architecture: its blocks carry an
  `img_mlp` with none of the 20B line's `txt_*` / `img_mod` / `add_*_proj`
  joint-block halves, and LoRAs do not transfer either way. Its metadata rule
  must run before the generic `qwen` rule.
- The OpenCLIP-G text encoder (`lora_te2_`) only exists on SDXL; a UNet LoRA
  without it stays ambiguous across SDXL and SD 1.5.
- Krea 2 (ai-toolkit LoKrs) is recognised by its `txtfusion` text-refiner branch.
