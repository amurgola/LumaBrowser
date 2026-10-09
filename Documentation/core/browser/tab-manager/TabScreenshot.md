# TabScreenshot

`core/browser/tab-manager/TabScreenshot.js`

Captures a tab as a PNG with its frame geometry.

## Methods

- `new TabScreenshot(nativeImage)`; `nativeImage` is optional and loaded from Electron on first rescale.
- `capture(page, { fullPage, marks, cssScale })`:
  - `fullPage`: grows the view to the page's scroll size, waits 500 ms for layout, captures, and
    always restores the bounds. Data `{ screenshot, mimeType }`.
  - otherwise: data `{ screenshot, mimeType, frame: { imageWidth, imageHeight, cssWidth, cssHeight, scale }, marks? }`.
    `cssScale` resizes a physical-pixel capture to viewport CSS px. `marks` draws the set-of-marks
    overlay ([VisionPageScripts](../vision/VisionPageScripts.md)) for this one capture, removed in a
    `finally`, and returns `{ text, count }`.

## Why

`capturePage` returns PHYSICAL pixels (display scale times page zoom) while clicks take viewport CSS px; the frame says how the two relate, and a point read off a `cssScale` image is directly clickable.
