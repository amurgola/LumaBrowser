# RuntimeAssetGenerator

`extensions/game-mode/assets/RuntimeAssetGenerator.js`

`AI.image()` from inside a running game: the build-time pipeline for play-time art under `assets/runtime/`, memoised per request and one render at a time process-wide.

## Methods

- `generate({ context, s, params, artStyle, imageModelRef, palette, emit })` -> `{ success, path, url, status, width, height, cached? }` or `{ success: false, error }`. Only a finished image is reused; a recorded placeholder is regenerated once images work. On one GPU the render runs inside the exclusive-image window.
- The model is picked like build-time generate_asset ([ImageModelPins](ImageModelPins.md) `describe` then `modelFor`, so RD Flow 64 only gets pixel-art it can draw), and the model and the game `palette` (`['#rrggbb', ...]` or null, from [GamePalettes](GamePalettes.md)) go to [AssetSpec](AssetSpec.md)`.prepare`.
