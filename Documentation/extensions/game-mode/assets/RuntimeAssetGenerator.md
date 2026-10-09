# RuntimeAssetGenerator

`extensions/game-mode/assets/RuntimeAssetGenerator.js`

`AI.image()` from inside a running game: the build-time pipeline for play-time art under `assets/runtime/`, memoised per request and one render at a time process-wide.

## Methods

- `generate({ context, s, params, artStyle, imageModelRef, emit })` -> `{ success, path, url, status, width, height, cached? }` or `{ success: false, error }`. Only a finished image is reused; a recorded placeholder is regenerated once images work. On one GPU the render runs inside the exclusive-image window.
