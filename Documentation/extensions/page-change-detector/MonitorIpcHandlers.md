# MonitorIpcHandlers

`extensions/page-change-detector/MonitorIpcHandlers.js`

IPC controller of Page Monitors. Channels (all `ext.page-change-detector.*`):

| Channel | Reply |
|---|---|
| `getAll()`, `getOne(id)` | rows (raw) |
| `getHistory(monitorId, limit = 20)`, `getHistoryPaged(monitorId, options)` | rows / page object (raw) |
| `create(data)` | `{ success: true, monitor }` or `{ success: false, error }` |
| `update(id, updates)`, `clearSelectors(id)` | `{ success: true, monitor }`, `Monitor not found` or the error |
| `delete(id)` | `{ success: <deleted> }` |
| `checkNow(id)` | `{ success: !error, ...outcome }` or `{ success: false, error }` |
| `pickElements(id)` | `{ success: true, cancelled, selectors?, monitor? }` or the error |

The renderer also listens on `ext.page-change-detector.changed`
([MonitorBroadcast](MonitorBroadcast.md)).

## Methods

- `MonitorIpcHandlers.register(ipc, service)`.
