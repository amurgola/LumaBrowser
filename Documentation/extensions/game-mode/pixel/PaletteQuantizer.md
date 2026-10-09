# PaletteQuantizer

`extensions/game-mode/pixel/PaletteQuantizer.js`

Snaps an RGBA image to a k-colour palette (deterministic k-means, seeds evenly spaced along the luminance-sorted pixels, 5 iterations). Transparent pixels are untouched and never vote.

## Methods

- `PaletteQuantizer.quantize(rgba, k = 24)` mutates and returns rgba.
