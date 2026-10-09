# CapturerWindow

`extensions/tab-share/CapturerWindow.js`

The one hidden BrowserWindow that does Tab Share's WebRTC work (Electron's
main process has no WebRTC).

## Methods

- `new CapturerWindow({ electron, extensionDir, takePendingFrame, onMessage, onClosed, onRendererGone, log })`;
  `electron` is `{ BrowserWindow, session, ipcMain }`.
- `open()`: installs the display-media handler on partition
  `tabshare-capturer` (grants `{ video: frame }` from `takePendingFrame()`,
  else `{}` and a log line; `useSystemPicker: false`), creates the window
  (`show: false`, preload `rtc/capturer-preload.js`, `contextIsolation: true`,
  `nodeIntegration: false`, `backgroundThrottling: false`), listens on
  `CHANNEL` (`ext.tab-share.rtc`) for messages from this window only, and
  loads `rtc/capturer.html`. Resolves on `markReady()`; rejects on a load
  error or after `READY_TIMEOUT_MS` (20 s).
- `markReady()`, `isOpen()`, `send(msg)`, `destroy()` (removes the IPC
  listener, destroys the window).
- `closed` -> `onClosed()`; `render-process-gone` -> `onRendererGone(reason)`.
