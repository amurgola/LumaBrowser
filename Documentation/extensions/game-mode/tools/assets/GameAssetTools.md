# GameAssetTools

`extensions/game-mode/tools/assets/GameAssetTools.js`

Builds the game-specific tools of one turn: generate_asset, generate_assets, run_game, fetch_gamedev_doc.

## Methods

- `GameAssetTools.build({ context, conversationId, sessions, gameDir, name, kind, kbCacheDir, artStyle, imageModelRef, palette, modelRef, gatewayInfo })`; `imageModelRef` is the image pin (setup), `modelRef` this turn's language model (the vision gate). `artStyle`, `imageModelRef` and `palette` (the locked palette or null) go to both asset tools.
