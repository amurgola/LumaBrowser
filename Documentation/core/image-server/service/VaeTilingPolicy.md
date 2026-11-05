# VaeTilingPolicy

`core/image-server/service/VaeTilingPolicy.js`

Decides whether an image launch decodes with `--vae-tiling`.

## Methods

- `VaeTilingPolicy.decide({ model, profile, offloadToCpu, cudaDevice, diagnostics, env? })`
  returns a boolean. `profile` is [ImageSlotRoles](ImageSlotRoles.md)`.profile(role, model)`.
  1. Wanted for edit-class launches, unified generate+edit models
     (`supportsEdit`) and Wan video.
  2. Dropped when resident (`!offloadToCpu`) on a single named card whose total
     VRAM is at least `ROOMY_CARD_BYTES` (40 GB).
  3. `SD_EDIT_VAE_TILING` (image slots) or `SD_VIDEO_VAE_TILING` (video-class)
     set to `0` or `1` forces the result.
- `VaeTilingPolicy.TILE_SIZE` (1024): the pixel tile edge
  [ImageSlotLaunch](ImageSlotLaunch.md) passes with `--vae-tiling` when the
  binary lists `--vae-tile-size`.

## Why

Tiling shrinks the transient wan_vae reference-encode buffer (7 to 8 GB
un-tiled) and Wan's whole-frame-stack decode, but leaves faint tile seams and
costs decode time. A 32 GB card still spilled into system RAM un-tiled once a
reaction encoded several reference images (one edit took about 105 s), so only a
genuinely roomy card drops it. Other video families (MiniMax-H3) have no
upstream tiling guidance and keep the untiled decode.

The tile size matters more than the switch: sd-server's default 256 px tiles
(49 of them for a 1 MP image, 50% overlap) made a Qwen-Image 2.1 decode take
8.3 s per edit against 0.7 s untiled, with the encode 1.2 s against 0.44 s
(measured 2026-11-04 on the 5090). At 512 px the decode is 2.4 s with buffers
near 1 GB; at 1024 px a 1 MP image is one tile, the times match untiled and the
buffers are the untiled 4.6 GB decode and 2.0 GB encode, which is what the cap
still protects against on larger images.
