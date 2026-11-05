# MediaViewport

`core/llm-server/ui/js/chat/panel/media/MediaViewport.js`

The media viewer's zoom and pan: the region editor's
[RegionViewport](../../region/RegionViewport.md) (fit, zoom about the pointer,
pan clamped to the picture) plus a 1:1 view, a ceiling that always reaches
eight screen pixels per image pixel (`MAX_PIXEL_SCALE`), and the zoom as a
percentage of the image's own size.

## Methods

- `maxZoom()`: `max(8, 8 / fitScale)`.
- `oneToOneZoom()`, `oneToOne(vx?, vy?)`.
- `percent()`, `isFit()`.
- `toggle(vx, vy)`: fit when zoomed, else 1:1 (or twice the fit when 1:1 is the
  fit).
- `step(dir)`: one `STEP` (1.25) in or out about the centre.
- `zoomTo(zoom, vx, vy)`, `setSize(width, height)` (refits).
