# LocalApiIpcHandlers

`core/llm-server/LocalApiIpcHandlers.js`

IPC controller that lets the Settings tab toggle the loopback OpenAI-compatible
endpoint (LocalApiServer) and change its port.

## Methods

- `LocalApiIpcHandlers.register(localApiServer)` registers three `ipcMain.handle`
  channels:
  - `core.llmServer.localApi.getConfig` -> `localApiServer.getConfig()`
  - `core.llmServer.localApi.setEnabled(enabled)` -> `localApiServer.setEnabled(enabled)`
  - `core.llmServer.localApi.setPort(port)` -> `localApiServer.setPort(port)`

  The two setters reply with the service result plus `config` (the fresh
  `getConfig()`), so the renderer redraws from one shape.
- Channel names are exposed as `CHANNEL_GET_CONFIG`, `CHANNEL_SET_ENABLED`,
  `CHANNEL_SET_PORT`.

This is a controller: it routes only, so it has no tests. LocalApiServer holds the
logic and is tested in its own port. Wired once from `main.js` at startup.
