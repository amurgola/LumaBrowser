# RegionOverlay

`core/llm-server/ui/js/chat/region/RegionOverlay.js`

The region editor's guide layer: a canvas over the viewport (never
transformed, so lines stay one pixel wide at any zoom) that shows the brush
as a ring before the click, the rectangle being dragged, and the dashed box of
the close-up the model will be given. Everything it draws is in viewport CSS
pixels.

## Methods

- `new RegionOverlay({ canvas })`: null-safe without a 2D context (jsdom).
- `resize(width, height)`: matches the backing store to the viewport's CSS
  size at the device pixel ratio.
- `draw({ cursor, rect, context })`: `cursor` `{ x, y, radius, eraser }` (a
  white ring with a dark edge, dashed for the eraser, with a crosshair when
  smaller than `TINY_RADIUS`); `rect` the drag in progress (translucent paint
  fill and a dashed line); `context` the close-up box (dashed, light over
  dark so it reads on any picture). Any of them null is skipped.

## Why

The one complaint about the editor was not knowing how big a stroke would be
until it landed; a ring under the pointer, sized from the brush and the zoom,
answers it without a click. Drawing the guides on a separate untransformed
canvas means the paint layer stays a plain image-sized canvas and the guides
need no redraw of the paint.
