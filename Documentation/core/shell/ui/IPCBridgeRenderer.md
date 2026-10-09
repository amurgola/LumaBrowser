# IPCBridgeRenderer

`core/shell/ui/IPCBridgeRenderer.js` (ES module)

Renderer twin of the main-process IPCBridge: scopes an extension renderer's IPC to its `ext.<id>.<channel>` channels over the preload's generic bridge.

## Methods

- `new IPCBridgeRenderer(api)`: `api` has `invoke`, `on` (returns unsubscribe)
  and `send`, such as `window.ipcBridge`.
- `forExtension(extensionId)` returns `{ invoke(channel, ...args) -> Promise,
  on(channel, cb) -> unsubscribe, send(channel, ...args), namespace }` where
  `namespace` is `ext.<id>`.

## Globals

None.
