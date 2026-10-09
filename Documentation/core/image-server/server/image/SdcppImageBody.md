# SdcppImageBody

`core/image-server/server/image/SdcppImageBody.js`

Builds the `POST /sdcpp/v1/img_gen` request body from an image request.

## Methods

- `SdcppImageBody.build(request)` returns the body. Defaults: 512 x 512, 20
  steps, `euler`, cfg 7.0, `png`, `batch_count: 1`; a seed below 0 or missing
  is `-1` (random).
  - `negative_prompt`, `lora` (non-empty array), `ref_image_args`, and
    `cache_mode` (+ `cache_option`) only when given.
  - `customSigmas` with more than one value sets `sample_params.custom_sigmas`
    and `sample_steps = length - 1`.
  - `initImage` -> `init_image` (base64) with a top-level `strength` in [0, 1],
    default 0.75; `mask` -> `mask_image` (clamped), only with an init image.
  - `refImages` -> `ref_images`, falsy entries dropped, each clamped by
    [RefImageClamp](RefImageClamp.md) to `boundFor(width, height)`.
- Statics: `DEFAULT_SIZE`, `DEFAULT_STEPS`, `DEFAULT_SAMPLER`, `DEFAULT_CFG`, `DEFAULT_STRENGTH`.

## Why

- LoRAs go in the structured `lora` array (`{ path, multiplier,
  is_high_noise? }`, relative to `--lora-model-dir`): every sd-server API
  ignores `<lora:>` prompt tags.
- `strength` must be top level: sd.cpp silently ignores it inside
  `sample_params` and runs text-to-image instead (the "edit returned a totally
  different cat" symptom).
- Mask: white is re-denoised, black is kept from the init image.
