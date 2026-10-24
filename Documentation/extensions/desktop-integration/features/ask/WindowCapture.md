# WindowCapture

`extensions/desktop-integration/features/ask/WindowCapture.js`

How the [ask feature](index.md) looks at another app's window, built on the
desktop control stack in `core/desktop` instead of new capture code: the
DesktopService (`global.__lumaDesktop`) and its `win` surface
([Win32](../../../../core/desktop/Win32.md)) for window facts, `capture()` and
[ScreenshotImage](../../../../core/desktop/service/ScreenshotImage.md) for the
image, the UIA sidecar's `wake` and
[WindowObserver](../../../../core/desktop/service/WindowObserver.md)'s Chromium
test for browsers and Electron apps,
[SystemPromptDetector](../../../../core/desktop/SystemPromptDetector.md) and
[AntiCheatDetector](../../../../core/desktop/AntiCheatDetector.md) for refusals.
The text itself comes from [WindowText](WindowText.md).

It sends no input and never brings the target forward, so desktop control's
opt-in and input guards do not apply; its own refusals do.

`new WindowCapture({ getDesktop, getNativeImage, textReader, ownPids, isCloaked, sleep, platform })`,
all optional (defaults: `global.__lumaDesktop`, Electron's `nativeImage`, a
WindowText, the pids of `app.getAppMetrics()`, `Win32Windows.isCloaked`).

## Methods

- `unavailable()`: a reason string when capture cannot work (not Windows,
  DesktopService not booted), else null.
- `describe(hwnd)`: `{ w }`, `{ own: true, w }` (a window of any Luma process)
  or `{ error, code, status }`. `w` is
  `{ hwnd (the top-level root), title, className, pid, rect, minimized, exe, app }`.
  Refusals, in order: `NO_WINDOW` 404, `SYSTEM_PROMPT` 403, `ANTI_CHEAT` 403,
  `ELEVATED` 403, `PROTECTED` 403 (no exe path and no elevation answer),
  `MINIMIZED` 409, `NOT_VISIBLE` 409 (hidden, cloaked, or under 40x30). See
  `CODES`.
- `refusal(win, api, w)`: the refusal part of `describe`.
- `foregroundWindow()`: the top-level window in front, or 0.
- `screenshot(w)`: `{ data (PNG base64), mime, width, height, method }` via
  `DesktopService.capture` (PrintWindow, with its own black-frame fallback);
  when PrintWindow fails outright, the on-screen pixels of the window's frame
  (`screen-region`). Throws when both fail.
- `text(w, { maxChars })`: `{ text, count, truncated }`. Chromium and Electron
  windows are woken first (best effort) and re-read once after
  `CHROMIUM_RETRY_MS` when the first answer is under `SPARSE_CHARS`; the longer
  answer wins.
