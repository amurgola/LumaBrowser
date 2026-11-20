# AppWindows

`extensions/desktop-integration/shared/AppWindows.js`

The Luma main window for desktop features (`deps.windows`).

## Methods

- `new AppWindows({ browser?, electron? })`: `browser` is `context.browser`.
- `getMainWindow()`: `browser.getMainWindow()`, else the open window titled
  LumaBrowser, else any open window, else null.
- `focusMainWindow()`: raises the window with
  [WindowRaiser](../../../core/browser/WindowRaiser.md) (restore if minimized, show, focus, on Windows briefly
  topmost), then gives its page the keyboard focus. True when
  a window was raised. For the focus to land, the client should call
  `AllowSetForegroundWindow(<handshake pid>)` before its request.
