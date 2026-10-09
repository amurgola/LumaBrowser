# TabFrameGrabber

`extensions/tab-share/TabFrameGrabber.js`

Captures one JPEG frame of a shared tab.

## Methods

- `new TabFrameGrabber({ getWebContents, getView, getFallbackBounds })`.
- `grab()` resolves `{ jpeg, meta: { w, h, vw, vh } }` (`w`, `h` the encoded
  frame, `vw`, `vh` the view's DIP size), or null when the webContents is
  gone, the view has no size, or the capture is empty. Frames wider than
  `MAX_WIDTH` (1280) are resized; JPEG quality `JPEG_QUALITY` (68). Capture
  errors propagate (the streamer backs off).
- `liveWebContents()`: the webContents unless destroyed.
- `viewSize()`: the view's `{ width, height }`. A never-shown 0x0 view is
  first given the manager's current page bounds (it stays hidden); null when
  neither has a size.

## Why

`capturePage` produces real, changing frames from a hidden
(`setVisible(false)`) view, even with the window minimised. The only thing a
never-shown view lacks is a size.
