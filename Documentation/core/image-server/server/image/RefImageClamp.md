# RefImageClamp

`core/image-server/server/image/RefImageClamp.js`

Downscales an oversized reference image before an edit request, so its VAE
encode cannot spike VRAM and OOM the edit slot.

## Methods

- `RefImageClamp.clamp(b64, maxPixels = MAX_PIXELS)` takes and returns base64.
  An image more than `SLACK` times past `maxPixels` is downscaled to
  `maxPixels`, preserving aspect, as PNG. Anything else, any error, or running
  outside an Electron main process returns the input unchanged.
- `RefImageClamp.boundFor(width, height)` is the larger of `MAX_PIXELS` and the
  request canvas area.
- Statics: `MAX_PIXELS` (1024 x 1024), `SLACK` (1.25).

## Why

Qwen-Image-Edit stitches references side by side in latent space, so a
multi-thousand-pixel uploaded avatar spiked VRAM mid-roleplay. The bound is what
the runtime works at: about 1 MP, or the canvas when larger (Qwen-Image 2.1
resizes every reference to the canvas area). A reference within the slack is
sent as it is, because the runtime resizes it to its own grid anyway and
resampling a 1.06 MP head-shot here only softens the face twice.
