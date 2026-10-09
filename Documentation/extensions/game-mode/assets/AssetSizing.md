# AssetSizing

`extensions/game-mode/assets/AssetSizing.js`

Asset dimensions: the file size the game lays out for, the logical grid of pixel-art, and the larger size the image model renders before the post-chain downscales it.

## Methods

- `clampDim(n, fallback = 256)` output size clamped to 16-1024 and snapped to 8.
- `pixelGridFor(outW, outH, pixelSize?)` `{ logicalW, logicalH, pixelScale }`: an explicit pixelSize (capped at 16) wins, else the smallest scale bringing the long side within 256, preferring one dividing both sides.
- `genDimsFor(scaleUp, outW, outH, native?)` `{ genW, genH }`: an integer multiple of the grid near the model's native long side (512 when unknown, never below 512), capped by `genTargetFor`, snapped to 16.
- `genTargetFor(gridLong)` 512 up to 64, 768 up to 128, else unbounded (measured: a 48 px sprite gains nothing from 1024 and costs ~4x).
- Constants: `MIN_ASSET_DIM`, `MAX_ASSET_DIM`, `SMALL_ASSET_NATIVE` (256), `LOGICAL_PIXEL_MAX` (256), `MAX_PIXEL_SIZE` (16), `GEN_GRID` (16), `GEN_TIERS`.
