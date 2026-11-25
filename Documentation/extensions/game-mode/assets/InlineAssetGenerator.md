# InlineAssetGenerator

`extensions/game-mode/assets/InlineAssetGenerator.js`

Generates one prepared asset mid-turn and writes it over its placeholder.

## Methods

- `generate({ chat, s, spec, modelRef, emit })` -> `{ status: done|placeholder|error, notes, error? }`. Notes say honestly what landed: model, pixel grid, downscale, transparency (or that keying failed), coerced style. An RD Flow 64 asset's pixel note reads `pixel-art drawn at 64x64`, plus `fitted to a WxH grid` when its grid is not 64x64 and `in the game palette` when a palette is locked.
