# McpServerService

`extensions/mcp-connector/McpServerService.js`

The server operations shared by the Setup tab and the REST routes: persist a
config change, then apply it to the live connection.

## Methods

- `new McpServerService({ store, manager })`; public field `store`.
- `rows()`: one row per stored config, merged with `manager.status()`:
  `{ id, name, transport, enabled, command, args, env, cwd, url, headers, status, error, tools }`
  (missing fields default to `''`, `[]` or `{}`; with no live row the status is
  `disabled` or `idle`).
- `get(id)`.
- `create(input)`: stores, then connects unless `enabled === false`.
- `update(id, patch)`, `setEnabled(id, enabled)`: store, then connect when
  enabled, else disconnect.
- `reconnect(id)`: the connect result, or `null` for an unknown id.
- `remove(id)`: disconnects first, then deletes; returns the store's boolean.

## Why

Legacy wrote the same "store then connect/disconnect" sequences twice, once in
`main.js#handleSetupInvoke` and once in `routes.js`.
