# VisionPageScripts

`core/browser/vision/VisionPageScripts.js`

In-page script sources for the visual layer.

## Methods

- `VisionPageScripts.drawMarksScript(rows)`: draws the set-of-marks overlay for
  digest rows `{ ref, box: [left, top, width, height] }` (rows without a
  four-number box are skipped): a coloured box and numbered tag per ref, in a
  closed shadow root on a fixed, `pointer-events:none` host at max z-index.
  Removes any previous overlay first and resolves `{ success, count }` after two
  animation frames, so the overlay is painted before `capturePage`.
- `VisionPageScripts.removeMarksScript()`: removes every overlay host.
- `VisionPageScripts.hitTestScript(x, y, { evidence = false })`: viewport size,
  `inView`, and the element under the point as `target` (`tagName`, `id`,
  `role`, `text` up to 80 chars, digest `ref`, link `href`, `cursor`, `frame`).
  With `evidence: true` (click_at, about to click) an in-view hit also returns
  the action-evidence before-snapshot as `fp`, at no extra round trip.
- `MARKS_HOST_ATTR` (`data-luma-marks`), `PALETTE` (10 high-contrast colours, cycled by ref).

## Why marks

A vision model can answer "click ref 12" (DOM-exact, survives scrolling)
instead of guessing pixels. The overlay exists only for one capture; the
caller removes it in a `finally`.
