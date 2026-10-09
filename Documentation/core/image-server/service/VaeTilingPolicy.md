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

## Why

Tiling shrinks the transient wan_vae reference-encode buffer (7 to 8 GB
un-tiled) and Wan's whole-frame-stack decode, but leaves faint 32x32 tile seams
and costs decode time. A 32 GB card still spilled into system RAM un-tiled once a
reaction encoded several reference images (one edit took about 105 s), so only a
genuinely roomy card drops it. Other video families (MiniMax-H3) have no
upstream tiling guidance and keep the untiled decode.
