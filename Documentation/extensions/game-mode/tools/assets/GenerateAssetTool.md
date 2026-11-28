# GenerateAssetTool

`extensions/game-mode/tools/assets/GenerateAssetTool.js`

`generate_asset`: one image asset. The placeholder is written immediately and the real image is handed to the conversation's [AssetRenderQueue](../../assets/AssetRenderQueue.md) as a background render, so the call never waits on the image model. The result always says `queued` (`<path> · WxH queued`) and that the image renders right after this reply ends (`AssetTool.WHEN_IT_LANDS`), and tells the agent not to wait for it or request it again. The spec is prepared with the routed model and the game palette, so an RD Flow 64 sprite gets its own caption and 64x64 render.
