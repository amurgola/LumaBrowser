# AssetSpec

`extensions/game-mode/assets/AssetSpec.js`

Validates one asset request, plans its generation and writes its placeholder PNG at the real size.

## Methods

- `prepare({ s, params, artStyle, native })` `{ error }` or `{ rel, abs, width, height, genW, genH, logicalW, logicalH, pixelScale, isPixel, needsSmooth, wantAlpha, alphaUnavailable, styleNote, fullPrompt }`. Pixel-art, small-asset scale-up and transparency all need the canvas post-chain (`PixelPost.available()`).
