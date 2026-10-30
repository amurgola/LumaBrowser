# RegionViewport

`core/llm-server/ui/js/chat/region/RegionViewport.js`

The region editor's view of the image: fits the picture into the viewport,
zooms about the pointer and pans, keeping the image from leaving the
viewport. Pure arithmetic over the sizes it is given, written to the stage
element as left/top/width/height so the paint canvas stretched over the image
follows for free and `pointToImage` keeps working through
`getBoundingClientRect`.

## Methods

- `new RegionViewport({ viewport, stage, width, height })`: fits at once.
- `fitScale()`: display pixels per image pixel at zoom 1 (the whole image
  fits, never enlarged past its own size); `scale` (now); `displaySize()`;
  `viewportSize()`.
- `fit()`: zoom 1, centred.
- `zoomAt(factor, vx, vy)`: zooms about a viewport point so the image point
  under it stays under it; clamped to `MIN_ZOOM`..`MAX_ZOOM` (1..8). False
  when nothing changed.
- `panBy(dx, dy)`: false at fit.
- `toViewport(point)`, `rectToViewport(rect)`: image space to viewport CSS
  pixels, for the guide layer.
- `layout()`: clamps the offset (centred when the image is smaller than the
  viewport on an axis, otherwise never showing past an edge) and writes it.
- `WHEEL_STEP` (1.2 per notch).

## Why

A 1152-pixel-tall image in a 60vh box left a 4-pixel brush under a screen
pixel wide. Every mask editor surveyed (ComfyUI, Krita, InvokeAI) zooms with
the wheel and pans with Space; positioning the stage instead of transforming
it keeps the existing pointer mapping and the canvas-over-image layout intact.
