# ScreenFrames

`core/desktop/service/ScreenFrames.js`

The last screenshot frame of each window, so x/y a model read off a downscaled
screenshot map back to physical screen pixels.

## Methods

- `record(frame)` with `frame = { hwnd, screen: { x, y, width, height }, imageWidth, imageHeight }`
  (hwnd 0 for the whole desktop).
- `toScreen(w, x, y)` `{ sx, sy }`; throws `x/y are pixels of a desktop_screenshot
  of this window; take one first.` without a frame, and `That point is outside the
  window (it may have moved); take a fresh desktop_screenshot.` outside `w.rect`.
- `toScreenLoose(w, x, y)` the same mapping without the checks, or null without
  a frame (scroll falls back to the window centre).
