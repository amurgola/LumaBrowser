# ViewBoundsReporter

`ui/shell/layout/ViewBoundsReporter.js`

Tells main where to draw the active tab's native view. Recomputes at most once per frame when the container, the window or any overlay changes (ResizeObserver plus a body MutationObserver that also discovers dynamically mounted overlays such as LumaModal dialogs), and sends only real changes.

## Methods

- `new ViewBoundsReporter(container)`.
- `install()`.
- `queue()` (was `queueBoundsUpdate`).
- `computeBounds()`.
- `ViewBoundsReporter.isOverlayVisible(el)`.
- `ViewBoundsReporter.OVERLAY_SELECTORS`.
- `lastSent`.

## Globals

Reads `window.tabAPI.setBounds`.
