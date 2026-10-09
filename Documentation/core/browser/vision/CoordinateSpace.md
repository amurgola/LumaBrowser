# CoordinateSpace

`core/browser/vision/CoordinateSpace.js`

Converts points between the pixel spaces of visual grounding. The one place units change.

## Methods

- `CoordinateSpace.frameScale(frame)` returns device pixels per CSS px for a capture.
- `CoordinateSpace.imageToCss(point, frame)` / `cssToImage(point, frame)` convert between
  screenshot pixels and viewport CSS px. Both throw on a frame without four positive dimensions.
- `CoordinateSpace.modelToSent(point, format, sent)` turns a model's raw answer into pixels of the
  image that was sent to it; `sentToModel` is the inverse. Throw on an unknown format;
  `modelToSent` also throws on a non-numeric point.
- `CoordinateSpace.smartResize(width, height, { factor, minPixels, maxPixels })` returns the size a
  Qwen-family encoder sees: both sides multiples of `factor`, aspect ratio kept, pixel count clamped
  into `[minPixels, maxPixels]`. Mirrors transformers' qwen2_vl image processor.
- `CoordinateSpace.clampPoint(point, width, height)` clamps into `[0, w-1] x [0, h-1]`.
- `CoordinateSpace.pointInRect(point, rect)` is an edge-inclusive hit test.
- `CoordinateSpace.zoomWindow(point, width, height, { fraction, minSize })` returns the crop for a
  zoom-refine pass: `fraction` of each dimension, centred on the point, shifted (never shrunk) to
  stay inside the image, and at least `minSize` on a side where the image allows.
- `CoordinateSpace.COORD_FORMATS` maps `pixels`, `norm1000`, `norm999`, `norm1` to their kind/scale.

## The three spaces

- **css**: viewport CSS px, origin top-left. What `getBoundingClientRect` reports and what the
  trusted click takes.
- **image**: pixels of a captured screenshot. `capturePage` returns physical pixels, so on a 150%
  display a 1280-wide viewport comes back 1920 wide; page zoom scales it again.
- **model**: what a vision model answers in. Absolute pixels of the image it was sent (Qwen2.5-VL,
  UI-TARS, Claude, OpenAI) or a normalized grid (0-1000 Qwen3-VL / Qwen3.5+, Holo, UI-Venus, Gemini;
  0-999 MAI-UI; 0-1 Moondream).

A frame `{ imageWidth, imageHeight, cssWidth, cssHeight }` records one capture's geometry so a point
can be carried between spaces without re-measuring the page. Mixing any two spaces is how a click
lands in the wrong place.

Grounding resizes the capture to exact patch multiples before sending (`smartResize`) so the runtime
has nothing left to resize or pad. llama.cpp otherwise pads the bottom/right edge, which silently
shifts a normalized grid.
