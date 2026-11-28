# PlaceholderPng

`extensions/game-mode/assets/PlaceholderPng.js`

The placeholder PNG every asset gets before its real image exists, so a game never 404s an asset: one colour inside a darker frame, so it shows even on a backdrop of the same colour. A tiny local encoder (signature, IHDR, zlib IDAT, IEND with CRCs) needs no image library.

## Methods

- `solid(width, height, [r, g, b])` truecolor 8-bit PNG buffer of one flat colour.
- `framed(width, height, [r, g, b])` the asset placeholder: the colour inside a frame `FRAME_SHADE` (0.4) times as bright, `frameWidth(width, height)` pixels wide.
- `frameWidth(width, height)` 2 when the short side is `FRAME_MIN_SIDE` (16) or more, 1 from 4 up (a 4px tile keeps a visible middle), 0 below 4 (no frame).
- `colorFor(relPath)` a deterministic colour from `COLORS` by path hash; `BACKDROP_COLOR` the dark quiet colour of a full-canvas backdrop's placeholder, so the sprite placeholders on it read.
- `crc32(buf)` standard CRC-32.
