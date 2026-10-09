# McpSetupActions

`extensions/mcp-connector/McpSetupActions.js`

Backend of the "MCP Servers" Setup tab, reached over the auth-free
`setup.invoke` IPC so an API-key requirement never blocks it.

## Methods

- `new McpSetupActions({ getService })`: `getService()` returns the
  [McpServerService](McpServerService.md) or null while inactive.
- `invoke(action, payload)`: every reply carries `servers` (the refreshed rows).
  - `list` -> `{ servers }`
  - `create` (payload = config) -> `{ server, servers }`
  - `update` (`{ id, patch }`) -> `{ server, servers }`
  - `toggle` (`{ id, enabled }`) -> `{ server, servers }`
  - `reconnect` (`{ id }`) -> `{ result, servers }`; throws `Server not found`
  - `delete` (`{ id }`) -> `{ removed, servers }`

  Throws `MCP Connector not ready` while inactive and `Unknown action: <action>`
  otherwise (inherited object keys such as `constructor` included).
