# SdcppResult

`core/image-server/server/image/SdcppResult.js`

Reads the media out of a completed sd-server job.

## Methods

- `SdcppResult.images(data)` decodes `result.images[i].b64_json` (or `b64`) to
  `[{ bytes, mime (default image/png), width, height, seed }]`, skipping entries
  without data.
- `SdcppResult.video(data)` decodes the single server-encoded container,
  `result = { output_format, mime_type, fps, frame_count, b64_json }`, to
  `{ bytes, mime, fps, frameCount, outputFormat }`. Fallbacks: `b64`, a `media`
  object, a `video` string or object, and as a last resort a one-image `images`
  array (as `image/png`, one frame). `null` otherwise, including the
  multi-image (image-shaped) result.
- `SdcppResult.mimeForFormat(format)` maps webm, avi, webp, gif and mp4.
- `SdcppResult.resultKeys(data)` lists the result's keys, or `(none)`.
- `SdcppResult.redact(result)` replaces `b64_json`, `b64` and `images` with `'[omitted]'`.

## Why

vid_gen differs from img_gen: the server muxes the container itself, so a
completed job carries one file, not frames. Reading the image shape is what
once produced a bare "completed with no frames", so an empty video result
names the keys it did have.
