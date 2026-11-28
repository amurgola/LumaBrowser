# GameAssetTools

`extensions/game-mode/tools/assets/GameAssetTools.js`

Builds the game-specific tools of one turn: generate_asset, generate_assets, run_game, fetch_gamedev_doc.

## Methods

- `GameAssetTools.build({ context, conversationId, sessions, gameDir, name, kind, kbCacheDir, artStyle, imageModelRef, palette, modelRef, gatewayInfo, onAssetSettled, queue? })`; `imageModelRef` is the image pin (setup), `modelRef` this turn's language model (the vision gate). `artStyle`, `imageModelRef`, `palette` (the locked palette or null) and one [AssetRenderQueue](../../assets/AssetRenderQueue.md) for the conversation go to both asset tools; `onAssetSettled()` becomes the queue's `onSettled`, told after each render ends. `queue` is a test seam that replaces the built queue (it needs only `enqueue`).
