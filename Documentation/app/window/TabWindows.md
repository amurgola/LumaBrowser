# TabWindows

`app/window/TabWindows.js`

Windows made by dragging a tab out of a strip, like Chrome. Each detached window
runs the browser chrome (`index.html?window=detached`, see
[WindowMode](../../ui/shell/window/WindowMode.md)) over its own
[ChromeOverlay](../../core/browser/ChromeOverlay.md); the tabs stay in the one
[TabViewManager](../../core/browser/TabViewManager.md), so automation, history and
the chat still see them.

## Methods

- `new TabWindows(ctx, { log })`; `install(mainWindow, ipcMain)` registers the IPC
  channels (replacing earlier handlers, so a re-created main window can install
  again), closes a detached window on `windowEmptied`, and closes every detached
  window when the main window closes. Returns itself.
- `dragOut(sender, tabId)` -> `{ moved }`: the drag ended off the strip and the cursor
  (`screen.getCursorScreenPoint()`) decides. On or within `TEAR_OFF_DISTANCE` (40 px)
  below its own strip nothing moves. On another window's strip the tab joins it
  (that window is focused). Anywhere else (lower in its own window, so a maximized
  window can still tear off; another window's page; the desktop) it opens in a new
  window under the cursor. A window's only tab never leaves it: a detached window
  dropped elsewhere follows the cursor instead. A tab another strip already took
  (its `dropIn` arrived first) counts as moved.
- `dropIn(sender, tabId, index)`: a tab from another window was dropped on the
  sender's strip at `index` in the full order.
- `openFromMenu(sender, tabId)` -> `{ moved }`: "Move tab to new window", cascaded
  `CASCADE` (32 px) from the window it left.
- `openWith(tabId, bounds)`: creates the window hidden, moves the tab in once its
  chrome has loaded (so the renderer hears it arrive), then shows and focuses it. A
  tab gone in the meantime closes the window. Later loads resync the window's tabs.
- `closeAll()`, `count`, `TabWindows.contains(bounds, point)`,
  `TabWindows.nearStrip(bounds, point)`.

New windows use [MainWindowOptions](MainWindowOptions.md), the size of the window the
tab left (its restored size when maximized), placed so the cursor sits over the
first tab (`GRAB_OFFSET`) and kept on the cursor's display. They get
[WindowKeys](WindowKeys.md) and [WindowStateRelay](WindowStateRelay.md). On `close`
the window's tabs are handed back (`removeWindow`) while it is still alive, since
views can only leave a live window.

## IPC

`ipcMain.handle`: `tab-window:drag-out` (tabId), `tab-window:drop-in` (tabId, index),
`tab-window:open` (tabId). `TabWindows.CHANNELS` lists them.
