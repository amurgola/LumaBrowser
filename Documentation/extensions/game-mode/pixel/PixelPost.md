# PixelPost

`extensions/game-mode/pixel/PixelPost.js`

The post-chain entry points for generated assets. Every entry returns null on any failure, so callers keep the original image.

## Methods

- `available()`.
- `pixelArtProcess(png, outW, outH, { paletteSize = 24, palette, transparent, report, upscaleTo })` keys (before downscaling), K-Centroids, quantizes, optionally nearest-upscales; sets `report.keyed`. A `palette` (`[[r, g, b], ...]`, the game's locked one) replaces the image's own k-means palette: the cells are snapped to it with [PaletteQuantizer](PaletteQuantizer.md)`.snap`.
- `paletteArtResize(png, gridW, gridH, { upscaleTo })` for art that is already exact palette pixels (RD Flow 64's 64x64): a smaller grid is K-Centroided down and snapped back to the art's own colours (`PaletteQuantizer.coloursOf`), so no in-between shade appears; a larger grid is nearest-upscaled; alpha is kept as drawn, then optionally nearest-upscaled to `upscaleTo`.
- `removeBackground(png)` keys at full size; null when unsafe.
- `smoothProcess(png, outW, outH, { transparent, report })` keys at the generated size then high-quality downscales; null when there is nothing to do.
