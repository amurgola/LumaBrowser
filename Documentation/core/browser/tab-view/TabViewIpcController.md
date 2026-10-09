# TabViewIpcController

`core/browser/tab-view/TabViewIpcController.js`

Routes the chrome renderer's tab-view IPC to the TabViewManager. Controller only.

## Methods

- `TabViewIpcController.register(manager, notificationRelay)`.

## Channels

`ipcMain.handle`: `tab-view:create`, `close`, `switch`, `navigate`, `reload`,
`go-back`, `go-forward`, `get-history`, `go-to-index`, `set-zoom`, `get-zoom`,
`get-all`, `get-order` (all tabs including silent, hidden and internal),
`clear-cache`, `set-persist`, `show`, `get-persisted`, `stop`, `hard-reload`,
`move`, `cycle` (delta, default 1), `select-index`, `reopen-closed`, `find`,
`stop-find`, `print`, `toggle-devtools`, and the downloads shelf
`download-list`, `download-open`, `download-show`, `download-cancel`, `download-clear`.

`ipcMain.on`: `tab-view:set-bounds` and `notification-intercepted`
([TabNotificationRelay](TabNotificationRelay.md)).
