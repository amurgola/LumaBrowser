# RuntimeImageIndex

`extensions/game-mode/assets/RuntimeImageIndex.js`

The memo of play-time images an AI game has drawn, `.gamedata/images.json`, keyed by the game's `key` or a request hash.

## Methods

- `requestHash(params)` 16 hex chars over prompt, width, height, style, transparent.
- `read(gameDir)` the index or `{}`; `write(gameDir, index)`.
