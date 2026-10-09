# CanvasModule

`extensions/game-mode/pixel/CanvasModule.js`

Lazily loads `@napi-rs/canvas` for PNG decode and encode. A sideloaded install might not resolve it, so callers ask `available()` and degrade to "no post-chain".

## Methods

- `available()`, `get()`, `decodeToRgba(png)` -> `{ data, width, height }`, `encodePng(rgba, w, h)`.
