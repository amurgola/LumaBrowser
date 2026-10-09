# ScreenshotImage

`core/desktop/service/ScreenshotImage.js`

Turns a raw BGRA capture into the image a model looks at.

## Methods

- `ScreenshotImage.fromShot(nativeImage, shot)` a nativeImage of `shot`
  (`{ width, height, bgra }`), downscaled (quality `best`) so the long edge is at
  most `MAX_EDGE` (1600).
- `ScreenshotImage.fullSize(nativeImage, shot)` the same at native size (visual
  grounding locates on the full-resolution capture).
