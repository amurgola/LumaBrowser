# TabScreenshot

`core/browser/tab-manager/TabScreenshot.js`

Captures a tab as a PNG: the viewport with its frame geometry, the full page, or one element whole.

## Methods

- `new TabScreenshot(nativeImage)`; `nativeImage` is optional and loaded from Electron on first rescale.
- `capture(page, { selector, fullPage, marks, cssScale })`:
  - `selector` (wins over the other options): the first matching element, whole and at device pixels.
    The page scrolls it to the middle of the viewport and measures it; an element that fits is clipped
    out of the viewport, a larger one has the view grown around it for the one capture (500 ms for
    layout, measured again, bounds always restored). The clip is converted from CSS px to the view's
    pixels with the page zoom ([InputDriver](../InputDriver.md)`.toDip`). Data
    `{ screenshot, mimeType, element: { selector } }`; `{ success: false, error }` when nothing matches,
    the element has no size, the page does not answer, or the element vanished while the view was grown.
  - `fullPage`: grows the view to the page's scroll size, waits 500 ms for layout, captures, and
    always restores the bounds. Data `{ screenshot, mimeType }`.
  - otherwise: data `{ screenshot, mimeType, frame: { imageWidth, imageHeight, cssWidth, cssHeight, scale }, marks? }`.
    `cssScale` resizes a physical-pixel capture to viewport CSS px. `marks` draws the set-of-marks
    overlay ([VisionPageScripts](../vision/VisionPageScripts.md)) for this one capture, removed in a
    `finally`, and returns `{ text, count }`.
- `TabScreenshot.elementRectScript(selector)`: the in-page script that scrolls the element to the centre
  and answers `{ success, x, y, width, height, viewportWidth, viewportHeight }` in viewport CSS px.

## Why

`capturePage` returns PHYSICAL pixels (display scale times page zoom) while clicks take viewport CSS px; the frame says how the two relate, and a point read off a `cssScale` image is directly clickable.

A full-page image of a long page is scaled down by the client until small text is unreadable. One element, captured whole at full size, keeps it legible; its pixels are not click coordinates.
