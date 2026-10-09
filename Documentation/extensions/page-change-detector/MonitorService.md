# MonitorService

`extensions/page-change-detector/MonitorService.js`

The page monitor operations the IPC handlers, REST routes and MCP tools share.

## Methods

- `new MonitorService({ monitors, snapshots, checker, scheduler, picker, broadcast })`.
- `startAll()` arms every enabled monitor and returns the count; `stopAll()`.
- `getAllMonitors()`, `getMonitor(id)`, `getHistory(monitorId, limit = 20)`,
  `getHistoryPaged(monitorId, options)`.
- `createMonitor(data)`: validates through [MonitorFields](MonitorFields.md),
  inserts (`mon_...` id), arms it when enabled, broadcasts `created`, returns
  the row as read before arming (its `next_run` is still null, as in legacy).
- `updateMonitor(id, updates)`: null for an unknown id; always re-arms (or
  clears `next_run` when disabled), broadcasts `updated`, returns the fresh row.
- `deleteMonitor(id)`: stops the timer, deletes history and row, broadcasts
  `deleted`, returns whether the row existed.
- `checkMonitorNow(id)`: throws `Monitor not found`; else the checker outcome.
- `pickElementsForMonitor(id)`: `{ cancelled: true }` or `{ cancelled: false,
  selectors, monitor }` after storing the selectors.
- `onChange(callback)`: delegates to the checker.
