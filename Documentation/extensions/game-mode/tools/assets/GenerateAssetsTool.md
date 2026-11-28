# GenerateAssetsTool

`extensions/game-mode/tools/assets/GenerateAssetsTool.js`

`generate_assets`: up to 12 assets in one call. Every placeholder is written immediately and every real image queued on the conversation's [AssetRenderQueue](../../assets/AssetRenderQueue.md), ordered so the assets of one image model are contiguous (one model load serves the group). The message lists each item as `queued` (with `on <model>` when pinned), says each renders right after this reply ends, and the summary is `<queued>/<batch> assets queued`. Each item behaves like generate_asset; bad items are reported per line; overflow is named, never dropped silently. Each item's spec is prepared with its routed model and the game palette, as in generate_asset.

## Methods

- `MAX_BATCH_ASSETS` 12.
