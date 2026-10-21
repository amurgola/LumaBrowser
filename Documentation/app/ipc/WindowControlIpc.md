# WindowControlIpc

`app/ipc/WindowControlIpc.js`

IPC for the custom frameless title bar. Each channel acts on the window whose title
bar sent it: the main window or a window a tab was dragged out into.

## Methods

- `new WindowControlIpc(getWindow, { windowForSender })`: `getWindow()` is the main
  window; `windowForSender(webContents)` (CoreIpcRegistrar passes
  `BrowserWindow.fromWebContents`) finds the sender's window, falling back to the main one.
- `register(ipcMain)` handles `window:minimize`, `window:toggle-maximize`,
  `window:close`, `window:is-maximized` (`WindowControlIpc.CHANNELS`).
- `minimize(sender)`, `toggleMaximize(sender)`, `close(sender)`, `isMaximized(sender)`
  (false without a window); each a no-op without a window.
