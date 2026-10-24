# WindowContext

`extensions/desktop-integration/features/lumabyte/WindowContext.js`

The fresh look at a window one Lumabyte message carries, read only when the
message is sent.

- `read(hwnd, { screenshot, text })` -> `{ title, app, png (base64) | null, text, notes }`.
  `notes` says what could not be read (minimized, capture refused, UI
  Automation failed); the turn goes ahead without it.
- `screenshot(hwnd)`: PrintWindow of the window itself (so covered windows
  work), the on-screen pixels when that comes back black (Direct3D apps),
  downscaled by `ScreenshotImage` (long edge 1600).
- `accessibleText(hwnd)`: up to `TEXT_NODES` (150) UI Automation elements
  through `WindowObserver` (Chromium windows woken first), one `Role: name` line
  each, capped at `TEXT_CHARS` (8000).
