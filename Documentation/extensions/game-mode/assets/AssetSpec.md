# AssetSpec

`extensions/game-mode/assets/AssetSpec.js`

Validates one asset request, plans its generation (including the model's own prompt and the game palette) and writes its placeholder PNG at the real size.

## Methods

- `prepare({ s, params, artStyle, native, modelRef, palette })` `{ error }` or `{ rel, abs, width, height, genW, genH, logicalW, logicalH, pixelScale, isPixel, needsSmooth, wantAlpha, alphaUnavailable, styleNote, rdFlow, palette, fullPrompt }`. Pixel-art, small-asset scale-up and transparency all need the canvas post-chain (`PixelPost.available()`).
  - `modelRef` is the image model the asset routes to; a pixel-art asset on RD Flow 64 ([RdFlowAssets](RdFlowAssets.md)) sets `rdFlow`, renders at 64x64 and gets `RdFlowAssets.caption` as its prompt instead of [AssetStyle](AssetStyle.md)`.prompt`: that model draws 64x64 palette art itself, so it needs no larger render, style prefix or keying background.
  - `palette` is the game's locked `['#rrggbb', ...]` ([GamePalettes](GamePalettes.md)); the spec keeps it for pixel-art only, else `null`.
