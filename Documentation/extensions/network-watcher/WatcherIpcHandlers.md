# WatcherIpcHandlers

`extensions/network-watcher/WatcherIpcHandlers.js`

IPC controller of the Network Watcher settings tab. Channels (all
`ext.network-watcher.*`):

| Channel | Reply |
|---|---|
| `getAll()` | array of watcher JSON (raw) |
| `add(config)` | `{ success: true, watcher }` or `{ success: false, error }` |
| `update(id, updates)` / `toggle(id, enabled)` | `{ success: true, watcher }`, `Watcher not found`, or the validation error |
| `remove(id)` | `{ success: <removed> }` |
| `getStats()` | the stats object (raw) |
| `test(config)` | the `forwardToWebhook` reply of a [WatcherTestRun](WatcherTestRun.md) (`ipc` sample) |
| `getLastResponse(id)` | `{ success: true, watcherId, lastCapturedResponse }` or `Watcher not found` / `No captured responses yet for this watcher` |

## Methods

- `WatcherIpcHandlers.register(ipc, service)`.
