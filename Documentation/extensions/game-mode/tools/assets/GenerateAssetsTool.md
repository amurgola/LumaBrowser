# GenerateAssetsTool

`extensions/game-mode/tools/assets/GenerateAssetsTool.js`

`generate_assets`: up to 12 assets in one call, generated back-to-back on one model load and grouped by model. Each item behaves like generate_asset; bad items are reported per line; overflow is named, never dropped silently. Each item's spec is prepared with its routed model and the game palette, as in generate_asset.

## Methods

- `MAX_BATCH_ASSETS` 12.
