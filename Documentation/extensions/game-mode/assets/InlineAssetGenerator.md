# InlineAssetGenerator

`extensions/game-mode/assets/InlineAssetGenerator.js`

Generates one prepared asset and writes it over its placeholder, running the post-chain. [AssetRenderQueue](AssetRenderQueue.md) calls it from inside each background render task.

## Methods

- `generate({ chat, s, spec, modelRef, emit, onProgress? })` -> `{ status: done|placeholder|error, notes, error? }`. Notes say honestly what landed: model, pixel grid, downscale, transparency (or that keying failed), coerced style. An RD Flow 64 asset's pixel note reads `pixel-art drawn at 64x64`, plus `fitted to a WxH grid` when its grid is not 64x64 and `in the game palette` when a palette is locked. `onProgress({ step, totalSteps })`, when given, is passed to `chat.generateImage` with the request so the render's sampling steps reach the task's line in the chat strip.
