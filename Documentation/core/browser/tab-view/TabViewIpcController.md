# TabViewIpcController

`core/browser/tab-view/TabViewIpcController.js`

Routes the chrome renderers' tab-view IPC to the TabViewManager. Window-relative
requests act on the sender's window (`windowIdForSender`). Controller only.

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

`create` (opens in the sender's window), `cycle`, `select-index`, `reopen-closed`
and `set-bounds` act on the sender's window; the rest take a tab id.
