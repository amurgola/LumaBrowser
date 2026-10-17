# WindowCapture

`tools/docs/readme-shots/WindowCapture.js`

Captures the whole app window as the user sees it: tab strip plus the active WebContentsView. A page screenshot
cannot do that (the shell and each tab are separate pages), so `capture(app, outPath, { mode })` asks the main
process, through the Playwright ElectronApplication's `app.evaluate`, for `desktopCapturer.getSources({ types:
['window'] })` with `thumbnailSize` set to the window's physical size (bounds times the display's scale factor),
matches the source by `win.getMediaSourceId()` (then by title), and writes the thumbnail as PNG. The window is
raised first (restored, shown, focused through a momentary always-on-top) and given `SETTLE_MS` to repaint.

`mode: 'screen'`, or a capturer miss on Windows, falls back to `CopyFromScreen` in a PowerShell script over the
window's content rectangle in screen pixels (`physicalBounds`, from `screen.dipToScreenPoint`). Elsewhere a miss
throws.

The app window is the `BrowserWindow` titled `LumaBrowser`: the Luma On Demand widget is a BrowserWindow too and is
listed first, which once produced a 100x100 capture.

## Methods

- `static capture(app, outPath, { mode = 'window' })`: `{ width, height, mode }` of what was written.
- `static raise(app)`: show, restore and focus the window.
- `static resize(app, { width, height })`: content size in CSS pixels, then centered on its display; returns the
  content size the window ended up with.
- `static physicalBounds(app)`: content rectangle in screen pixels.
- `_viaCapturer(app)`: `{ png (base64), width, height }` or null.
- `_viaScreen(rect, outPath)`: the PowerShell grab.
