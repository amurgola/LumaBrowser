# PixelPost

`extensions/game-mode/pixel/PixelPost.js`

The post-chain entry points for generated assets. Every entry returns null on any failure, so callers keep the original image.

## Methods

- `available()`.
- `pixelArtProcess(png, outW, outH, { paletteSize = 24, transparent, report, upscaleTo })` keys (before downscaling), K-Centroids, quantizes, optionally nearest-upscales; sets `report.keyed`.
- `removeBackground(png)` keys at full size; null when unsafe.
- `smoothProcess(png, outW, outH, { transparent, report })` keys at the generated size then high-quality downscales; null when there is nothing to do.
