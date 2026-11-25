# PaletteQuantizer

`extensions/game-mode/pixel/PaletteQuantizer.js`

Snaps an RGBA image to a k-colour palette (deterministic k-means, seeds evenly spaced along the luminance-sorted pixels, 5 iterations), or to a given palette. Transparent pixels are untouched and never vote.

## Methods

- `PaletteQuantizer.quantize(rgba, k = 24)` mutates and returns rgba.
- `PaletteQuantizer.snap(rgba, palette)` mutates and returns rgba with every opaque pixel moved to its nearest colour of `palette` (`[[r, g, b], ...]`); an empty or missing palette leaves it unchanged. Used for the game's locked palette and to keep resized RD Flow 64 art in its own colours.
- `PaletteQuantizer.coloursOf(rgba)` the distinct colours of the opaque pixels, as `[[r, g, b], ...]`.
