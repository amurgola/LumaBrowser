# VisionLocator

`core/desktop/service/VisionLocator.js`

Finds a described thing on a window (or the whole desktop) with the visual
grounding model and returns its screen point: the fallback for whatever UI
Automation cannot see (video players, canvases, custom-drawn apps, the taskbar).
Shared by [DesktopClickLadder](DesktopClickLadder.md) (`desktop_click`
description) and [DesktopScroll](DesktopScroll.md) (`desktop_scroll` description).

## Methods

- `new VisionLocator(parts)` with DesktopService's `{ nativeImage, visualGrounding, capture }`.
- `available` (getter) whether visual grounding is wired in.
- `locate(w, description, { zoom = false })` captures `w` at full size
  ([ScreenshotImage](ScreenshotImage.md) `fullSize`), runs `locateInImage`
  (`skipVisionCheck: false`, `what` is `the desktop` for the hwnd 0 target, else
  `the "<title>" window`) and maps the image point back to screen pixels.
  Resolves `{ point: { sx, sy }, ms }`, or `{ result }` with a failure to
  return as is (`Visual grounding is not available.` or the model's own failure).
  The grounding profile's name is left out: a model read it as an app profile it
  had clicked.
