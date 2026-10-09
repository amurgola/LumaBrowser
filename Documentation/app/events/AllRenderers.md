# AllRenderers

`app/events/AllRenderers.js`

Sends one message to every live renderer.

## Methods

- `new AllRenderers(webContents)`: Electron's `webContents` module.
- `send(channel, payload)` to every non-destroyed webContents; never throws.
- `emitter(channel)` returns `(type, payload) => send(channel, { type, payload })`.

Channels the app sends on: `core.dashboard.tasks.event` (artifact tasks),
`core.llmServer.schedTasks.event` (scheduled tasks),
`core.llmServer.triggers.event` (triggers) and `core.llmServer.serverEvent`
`{ type: 'providers-changed' }` (a sharing peer changed its models).
