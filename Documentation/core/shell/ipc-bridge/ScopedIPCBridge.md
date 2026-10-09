# ScopedIPCBridge

`core/shell/ipc-bridge/ScopedIPCBridge.js`

One namespace's view of the [IPCBridge](../IPCBridge.md). Extensions receive one
as `context.ipc`; core services can get one from `IPCBridge.forCore`.

## Methods

- `namespace`: e.g. `ext.network-watcher` or `core.llm`.
- `handle(channel, handler)`, `on(channel, handler)`, `removeHandle(channel)`,
  `removeOn(channel)`: the IPCBridge methods with the namespace filled in.
- `send(window, channel, data)` sends `<namespace>.<channel>` to the window's
  webContents; a missing or destroyed window is skipped silently.

## Why

Extensions register on bare channel names and never need to know their prefix,
which keeps every extension's channels inside its own namespace for teardown.
