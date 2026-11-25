# RdFlowAssets

`extensions/game-mode/assets/RdFlowAssets.js`

RD Flow 64 as a game-asset model: which assets it can draw (pixel art on a near-square grid it reaches by whole pixels) and the caption it gets (its own trained wording, not the green-screen prompt other models need).

## Methods

- `SIZE` 64, the only size it draws; `MAX_ASPECT` 4/3 (its canvas is square, and a sprite a third wider than tall still reads after the grid resize).
- `isModel(modelRef)` true when the ref names `rd-flow` (also `rd_flow`, `rd flow`, `rdflow`, at the start or after `:` or `/`, any case).
- `canDraw({ pixel, gridW, gridH })` pixel-art only, aspect within `MAX_ASPECT`, and a long side up to 64 (reached by a palette-exact downscale) or a multiple of 64 (reached by whole-pixel zoom); anything else would smear or stretch its pixels.
- `caption(prompt, transparent)` the agent's prompt with `BANNED` style words removed (`pixel art`, `pixelated`, `64x64`, which Retro Diffusion's rdflow/prompting.py strips too). An opaque asset drops sentences that say transparent. A transparent one drops sentences about the background or transparency and inserts `MARGIN_SENTENCE` (unless the prompt already asks for a clear margin or nothing cut off) and `TRANSPARENT_SENTENCE` before the closing rendering sentences (`RENDERING`: outline, shading, palette, dither and so on), as in the training captions.

## Used by

- [ImageModelPins](ImageModelPins.md)`.modelFor` skips an RD Flow 64 pin for an asset it cannot draw.
- [AssetSpec](AssetSpec.md) sets `rdFlow`, the 64x64 render and the caption for a pixel-art asset routed to it.
- [GameAssetRules](../prompts/GameAssetRules.md) adds its caption rules to the prompt when a pin is RD Flow 64.

## Why

The model was trained on long plain captions only and draws badly from short prompts or the style prefix and green screen [AssetStyle](AssetStyle.md) builds for other models; it draws real transparency itself, so no keying background is wanted.
