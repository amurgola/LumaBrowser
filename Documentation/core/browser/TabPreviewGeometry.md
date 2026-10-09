# TabPreviewGeometry

`core/browser/TabPreviewGeometry.js`

The arithmetic behind a parked tab preview: mapping the host's rect to a window
rect, and choosing the page zoom that fits a desktop-shaped layout into a card.

## Methods

- `TabPreviewGeometry.toWindowRect(rect, content, hostZoom)` scales `rect` (host CSS px)
  by the host page zoom, offsets it by the content area, and returns the window rect,
  or null when either side is under `MIN_PREVIEW_PX` or it is not fully inside `content`.
- `TabPreviewGeometry.clampZoom(zoom)` rounds to 2 decimals and clamps to
  `[MIN_PREVIEW_ZOOM, 1]`; non-finite or non-positive input gives 1.
- `TabPreviewGeometry.widthZoom(boundsWidth)` the zoom at which the card holds a
  `FIT_TARGET_WIDTH_PX` (1280) wide layout.
- `TabPreviewGeometry.fittedZoom(baseZoom, boundsHeight, docHeight)` zooms further out
  when the document is taller than the visible height (with `FIT_SLACK` 3% tolerance);
  otherwise, including when `docHeight` is unknown, returns `baseZoom`.
- Constants: `MIN_PREVIEW_PX` 8, `FIT_TARGET_WIDTH_PX` 1280, `MIN_PREVIEW_ZOOM` 0.34, `FIT_SLACK` 1.03.

## Why

- Fully inside or nothing: clamping would resize the embedded page (setBounds
  resizes, it does not crop), and spilling would paint over the shell chrome.
- Below 8 px a preview is a sliver or a measurement artifact from a card still
  animating in.
- Zooming the page out enlarges its CSS viewport, so the same rectangle shows a
  desktop layout and more of the document. The 0.34 floor keeps an endless page
  from zooming out forever chasing a growing scrollHeight; at the floor a 600px
  card shows about a 1750x1150 viewport, still readable.
- `scrollHeight` is in zoomed CSS px, so it compares directly against
  `boundsHeight / baseZoom`.
- The zoom never goes above 1: a wide card does not zoom in.
