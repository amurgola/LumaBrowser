# ViewBoundsMath

`ui/shell/layout/ViewBoundsMath.js`

Pure geometry: the rect the native page view may occupy, the container minus every visible overlay (full cover collapses, full-height or full-width overlays trim one edge, corner popovers trim the cheapest edge).

## Methods

- `ViewBoundsMath.compute(base, overlayRects)` -> `{ x, y, width, height }` (integers).

## Globals

None.
