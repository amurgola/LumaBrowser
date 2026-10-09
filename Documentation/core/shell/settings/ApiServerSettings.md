# ApiServerSettings

`core/shell/settings/ApiServerSettings.js`

The REST API and MCP server settings. Every change takes effect after a restart.

## Methods

- `new ApiServerSettings({ db, restGateway?, env = process.env })`.
- `getApiPort()` `core.apiPort`, default 3000.
- `getEffectiveApiPort()` the gateway's live `port`, else `LUMA_API_PORT`, else
  the setting. Renderer-side REST callers must use this one.
- `setApiPort(port)` integers 1024-65535 only (`Port must be between 1024 and
  65535`); `{ success: true, requiresRestart: true }`.
- `getApiEnabled()` / `setApiEnabled(b)` (`core.apiEnabled`, default true) and
  `getMcpEnabled()` / `setMcpEnabled(b)` (`core.mcpEnabled`, default true);
  setters store booleans and return `{ success: true, requiresRestart: true }`.
