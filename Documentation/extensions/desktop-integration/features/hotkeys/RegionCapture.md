# RegionCapture

`extensions/desktop-integration/features/hotkeys/RegionCapture.js`

The screenshot behind `screenshot-to-chat`. The screen is captured before the
picker shows (so the dimming is never in the shot and menus that close on focus
loss are kept), then [RegionOverlay](RegionOverlay.md) asks for a rectangle and
the frozen shot is cropped to it.

- Windows: the whole virtual screen through desktop control's
  `Win32.captureBGRA` (physical pixels); the picked DIP rectangle is converted
  with `screen.dipToScreenRect` (else the display's scale factor) and offset by
  the virtual screen origin.
- Elsewhere: `desktopCapturer.getSources({ types: ['screen'] })` at the largest
  display's physical size, matched by `display_id`, scaled per display.

API:

- `constructor({ electron: { screen, nativeImage, desktopCapturer }, win, overlay, platform })`.
- `capture()` -> `{ success, png, width, height }` or codes `BUSY`, `CANCELED`, `FAILED`.
- `captureRect(rect)`: a known DIP rect (a picked window), cropped from the
  same frozen shot on the display it matches, no picker; `FAILED` on error.
- `cancel()`, `busy`.
- `static toPhysical(screen, display, rect)`, `static clamp(rect, maxW, maxH)`.
