# WindowKeys

`app/window/WindowKeys.js`

Keyboard handling on the shell renderer.

## Methods

- `WindowKeys.attach(win)` listens for `before-input-event`.
- `WindowKeys.handle(win, event, input)` on key down: F12 toggles the shell's
  DevTools (`'devtools'`); Ctrl (without Alt) plus `=`, `+`, `-` or `0` is
  prevented so Electron's own zoom never hits the shell and webview zoom works
  (`'blocked-zoom'`); else null.
