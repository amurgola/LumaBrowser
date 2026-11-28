# AssetTool

`extensions/game-mode/tools/assets/AssetTool.js`

Base of `generate_asset` and `generate_assets`: the shared request schema (`ASSET_PROPS`, so the two never drift) the sprite/backdrop model per asset, from the setup-time pins and palette, and the render queue both tools hand their assets to.

## Methods

- `WHEN_IT_LANDS` the sentence a queued result tells the agent about the real image: it renders right after this reply ends and replaces the placeholder by itself.
- `new AssetTool(scope, { artStyle, imageModelRef, palette, queue })` (`queue` the conversation's [AssetRenderQueue](../../assets/AssetRenderQueue.md), kept as `_queue`; `palette` the game's locked `['#rrggbb', ...]` or null, kept as `_palette` for the subclasses to pass to [AssetSpec](../../assets/AssetSpec.md)); protected `_modelFor(params)` is [ImageModelPins](../../assets/ImageModelPins.md)`.modelFor(describe(params, artStyle), pins)`, so an RD Flow 64 pin only gets pixel-art it can draw.
