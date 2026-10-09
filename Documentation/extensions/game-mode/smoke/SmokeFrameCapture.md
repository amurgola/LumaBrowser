# SmokeFrameCapture

`extensions/game-mode/smoke/SmokeFrameCapture.js`

Captures frames from the offscreen paint stream (falling back to `capturePage`), measures the canvas region in device pixels, saves PNGs when asked, and keeps the bytes of only the last two frames.

## Methods

- `new SmokeFrameCapture({ win, shotDir, sleep })`; `attach()` (paint listener, 30 fps); `snap(label, atMs)`; `shots`.
