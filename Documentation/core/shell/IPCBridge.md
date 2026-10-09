# IPCBridge

`core/shell/IPCBridge.js`

Central registry for main-process IPC channels. Every handler and listener is
filed under a namespace (`core.<name>` or `ext.<id>`) so an extension's channels
can be torn down together.

## Methods

- `handle(namespace, channel, handler)` registers `ipcMain.handle` on
  `<namespace>.<channel>`. Re-registering a channel removes the old handler
  first (with a warning) instead of letting Electron throw.
- `on(namespace, channel, handler)` registers `ipcMain.on` on the same scheme.
- `removeHandle(namespace, channel)`, `removeOn(namespace, channel)` remove one.
- `forExtension(extensionId)` returns a
  [ScopedIPCBridge](ipc-bridge/ScopedIPCBridge.md) for `ext.<extensionId>`
  (this is `context.ipc` for extensions).
- `forCore(coreName)` returns a ScopedIPCBridge for `core.<coreName>`.
- `removeAllForExtension(extensionId)` removes every handler and listener under
  `ext.<extensionId>.` (runtime disable of an extension).
- `getRegisteredChannels()` returns `{ handlers: string[], listeners: string[] }`
  (debugging).
- `destroy()` removes everything this bridge registered.

## Mapping for callers

| Caller wants | Call | Channel registered |
|---|---|---|
| extension invoke handler | `context.ipc.handle('getAll', fn)` | `ext.<id>.getAll` |
| extension event listener | `context.ipc.on('ping', fn)` | `ext.<id>.ping` |
| extension push to renderer | `context.ipc.send(win, 'changed', data)` | `ext.<id>.changed` |
| core service handler | `ipcBridge.forCore('llm').handle('getView', fn)` | `core.llm.getView` |
| raw namespace | `ipcBridge.handle('core.llm', 'getView', fn)` | `core.llm.getView` |

The renderer side invokes the full channel name (legacy `preload.js` exposes a
generic invoke/on/send for these namespaced channels).

## Why

Extensions are hot-reloadable, so registering a channel twice is a normal path;
Electron throws on a duplicate `handle()` unless the old one is removed first.
`forCore` produces `core.<name>`, the namespace core services actually use, so
core and extension namespaces cannot collide.
