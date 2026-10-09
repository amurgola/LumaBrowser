# VideoFrameFit

`core/image-server/video/VideoFrameFit.js`

Refits a video model's default canvas (an area budget) to an image-to-video
source frame's aspect ratio.

## Methods

- `VideoFrameFit.fit(model, firstFrame)` returns `{ width, height }` or null when
  the frame's dimensions cannot be read. `firstFrame` is a Buffer or base64. The
  budget is `model.defaults.width x height` (832x480 when absent); the grid is
  `max(16, model.constraints.dimensionMultiple)`. Uses
  [ImageDimensions](../../shared/content/ImageDimensions.md) `.read` and `.fitToBudget`.

## Why

sd-server resizes `init_image` to the request size, so this is where a portrait
still either keeps its aspect or gets squashed into 832x480. Fitting on the
model's own grid (MiniMax-H3: /32) lands inside the budget in one step; fitting at
/16 would let VideoConstraints align up past it.
