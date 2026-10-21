# WindowStateRelay

`app/window/WindowStateRelay.js`

Tells a window's chrome renderer whether the window is flush with the screen edge,
so the title bar drops its rounded corners.

## Methods

- `WindowStateRelay.attach(win)`: sends on `maximize`, `unmaximize`,
  `enter-full-screen`, `leave-full-screen` and every `did-finish-load` (a window
  that boots maximized never hears an event).
- `WindowStateRelay.send(win)`: `window:state` `{ maximized }` (maximized or full
  screen); nothing for a destroyed window.

Used by [MainWindow](MainWindow.md) and [TabWindows](TabWindows.md).
