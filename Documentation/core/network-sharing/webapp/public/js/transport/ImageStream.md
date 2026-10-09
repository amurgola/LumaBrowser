# ImageStream

`core/network-sharing/webapp/public/js/transport/ImageStream.js`

One image generation over `POST /sharing/image/generate` (NDJSON).

## Methods

- `new ImageStream(http)`.
- `generate(opts)`: posts `opts` as JSON; `progress` events call
  `opts.onProgress(payload)`, the first `image` event's first image becomes the
  result `{ b64, mime (default image/png) }`, an `error` event throws its message
  (`generation failed`). 401 throws Unauthorized, other failures
  `Image generation unavailable`; no image throws `No image returned`.
