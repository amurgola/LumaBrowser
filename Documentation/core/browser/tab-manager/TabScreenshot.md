# TabScreenshot

`core/browser/tab-manager/TabScreenshot.js`

Captures a tab as a PNG: the viewport with its frame geometry, the full page, or one element whole. A tab its
own window is not showing is captured on the [CaptureStage](CaptureStage.md).

## Methods

- `new TabScreenshot(nativeImage, stage)`; `nativeImage` is optional and loaded from Electron on first rescale,
  `stage` is a [CaptureStage](CaptureStage.md) by default.
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

## A tab its own window is not showing

`capture` asks the stage first (`isOnScreen`). A tab whose window is minimised or in the tray, or that sits
behind the tab on screen, cannot be captured where it is: the capture answers an empty image or never answers
([CaptureStage](CaptureStage.md) has the measurements). The whole capture then runs with the view lent to the
stage, so growing the view for a full page or a tall element really resizes the page:

- on the stage the page is let go of the viewport it was told ([TabViewManager](../TabViewManager.md)
  `freeViewport`). A silent or hidden tab in a tray window is pinned to that size by device emulation, and a
  full-page capture came out with the bottom of the page blank;
- every capture on the stage waits for the first painted frame (`CaptureStage.capture`);
- once the view is back in its own window, `layoutTab` places the tab again, which tells its page the viewport
  again where the window still sizes nothing.

A page that paints nothing in time, on the stage or in a window that is showing, is the error
`NOT_PAINTED_ERROR` ("The page has not painted anything to capture yet") instead of a broken image.

## Why

`capturePage` returns PHYSICAL pixels (display scale times page zoom) while clicks take viewport CSS px; the frame says how the two relate, and a point read off a `cssScale` image is directly clickable.

A full-page image of a long page is scaled down by the client until small text is unreadable. One element, captured whole at full size, keeps it legible; its pixels are not click coordinates.
