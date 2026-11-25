# AssetTool

`extensions/game-mode/tools/assets/AssetTool.js`

Base of `generate_asset` and `generate_assets`: the shared request schema (`ASSET_PROPS`, so the two never drift) and the sprite/backdrop model per asset, from the setup-time pins and palette.

## Methods

- `new AssetTool(scope, { artStyle, imageModelRef, palette })` (`palette` the game's locked `['#rrggbb', ...]` or null, kept as `_palette` for the subclasses to pass to [AssetSpec](../../assets/AssetSpec.md)); protected `_modelFor(params)` is [ImageModelPins](../../assets/ImageModelPins.md)`.modelFor(describe(params, artStyle), pins)`, so an RD Flow 64 pin only gets pixel-art it can draw.
