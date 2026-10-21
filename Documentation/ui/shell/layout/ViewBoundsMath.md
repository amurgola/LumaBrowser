# ViewBoundsMath

`ui/shell/layout/ViewBoundsMath.js`

Pure geometry: the rect the native page view may occupy, the container minus every visible overlay (full cover collapses, full-height or full-width overlays trim one edge, corner popovers trim the cheapest edge).

## Methods

- `ViewBoundsMath.compute(base, overlayRects)` -> `{ x, y, width, height }` (integers). A result
  with no area (an overlay that covers the view bar a sub-pixel sliver, so the trim leaves a zero
  height or width) is the collapsed rect `{ 0, 0, 0, 0 }`, the one shape main sees for "hidden".

## Globals

None.
