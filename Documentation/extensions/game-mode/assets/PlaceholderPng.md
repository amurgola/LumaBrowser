# PlaceholderPng

`extensions/game-mode/assets/PlaceholderPng.js`

The solid-colour placeholder PNG every asset gets before its real image exists, so a game never 404s an asset. A tiny local encoder (signature, IHDR, zlib IDAT, IEND with CRCs) needs no image library.

## Methods

- `solid(width, height, [r, g, b])` truecolor 8-bit PNG buffer.
- `colorFor(relPath)` a deterministic colour from `COLORS` by path hash.
- `crc32(buf)` standard CRC-32.
