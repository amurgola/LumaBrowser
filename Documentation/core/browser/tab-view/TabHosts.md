# TabHosts

`core/browser/tab-view/TabHosts.js`

The windows tabs can live in. Host 0 (`TabHosts.MAIN_ID`) is the main window and
always exists; a tab dragged out of a strip gets a detached host of its own
([TabWindows](../../../app/window/TabWindows.md) creates the window). Each host
keeps the content bounds its chrome renderer reports.

## Methods

- `new TabHosts(mainWindow)`.
- `add(window)` -> the new host id; `remove(hostId)` (never the main host).
- `has(hostId)`, `ids()`, `resolve(hostId)` (a known id as given, anything else -> 0).
- `windowOf(hostId)`; `liveWindowOf(hostId)` (null once the window is gone).
- `boundsOf(hostId)`, `setBounds(hostId, bounds)`.
- `idForSender(webContents)`: the host whose chrome renderer sent an IPC message.
  Any other sender (a tab page, an overlay, none) maps to the main window, which is
  what every caller meant before windows could be detached.
- `TabHosts.isLive(win)`.
