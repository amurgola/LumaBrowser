# RegionOverlay

`extensions/desktop-integration/features/hotkeys/RegionOverlay.js`

The region picker: one frameless, transparent, always-on-top
(`screen-saver` level) window per display, dimmed with a crosshair and a hint.
The user drags a rectangle with the left button on any display; Esc or a right
click cancels; a box under 4 px is ignored. The page is an inline document
loaded as a data URL; it exposes `window.__lumaPick`, a promise the main
process awaits through `executeJavaScript`, so there is no preload or IPC. The
first window to answer wins and every window is destroyed. A faint fill stays
everywhere, including inside the selection, so mouse events never fall through
a fully transparent pixel.

- `constructor({ BrowserWindow, timeoutMs = 120000 })`.
- `pick(displays)` -> `{ displayId, rect }` (DIP, relative to that display) or
  null (canceled, timed out, a window closed, or a pick already open).
- `cancel()`, `active`.
- `static pageHtml()`, `static pageUrl()`.
