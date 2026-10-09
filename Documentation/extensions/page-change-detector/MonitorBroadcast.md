# MonitorBroadcast

`extensions/page-change-detector/MonitorBroadcast.js`

Pushes `ext.page-change-detector.changed` `{ reason, monitorId, monitor }` to
every window. Reasons: `created`, `updated`, `deleted`, `check-started`,
`check-finished`, `scheduled`.

## Methods

- `new MonitorBroadcast({ ipc, repository, send? })`: the channel is
  `<ipc.namespace>.changed`; a null `ipc` disables broadcasting. `send`
  defaults to core [RendererBroadcast](../../core/shell/extensions/RendererBroadcast.md)`.send`.
- `emit(reason, monitorId)`: `monitor` is the current row, or null.
