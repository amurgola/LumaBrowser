# WindowControlIpc

`app/ipc/WindowControlIpc.js`

IPC for the custom frameless title bar.

## Methods

- `new WindowControlIpc(getWindow)`.
- `register(ipcMain)` handles `window:minimize`, `window:toggle-maximize`,
  `window:close`, `window:is-maximized` (`WindowControlIpc.CHANNELS`).
- `minimize()`, `toggleMaximize()`, `close()`, `isMaximized()` (false without a
  window); each a no-op without a window.
