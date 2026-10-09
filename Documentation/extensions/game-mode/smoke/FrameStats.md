# FrameStats

`extensions/game-mode/smoke/FrameStats.js`

The measured screen check on a frame: black, dark and mean brightness over every third pixel of the canvas region, a colour count, and a verdict (`black`, `nearly-black`, `flat`, `content`, `empty`). The near-black page background counts as black.

## Methods

- `FrameStats.measure(bgra, width, height, rect?)`.
