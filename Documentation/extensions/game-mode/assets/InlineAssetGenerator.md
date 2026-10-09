# InlineAssetGenerator

`extensions/game-mode/assets/InlineAssetGenerator.js`

Generates one prepared asset mid-turn and writes it over its placeholder.

## Methods

- `generate({ chat, s, spec, modelRef, emit })` -> `{ status: done|placeholder|error, notes, error? }`. Notes say honestly what landed: model, pixel grid, downscale, transparency (or that keying failed), coerced style.
