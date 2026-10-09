# McpServerStore

`extensions/mcp-connector/McpServerStore.js`

Persists the user's external MCP server configs as one JSON array under
`mcpConnector.servers`. Extends
[JsonCollectionStore](../../core/database/JsonCollectionStore.md).

A stored config: `{ id, name, transport: 'stdio'|'http'|'sse', enabled,
command, args, env, cwd (stdio) | url, headers (http/sse), createdAt, updatedAt }`.

## Methods

- `new McpServerStore(rawDb)` (`context.db.getRawDb()`); `list`, `get`,
  `delete` from the base.
- `create(input)`: normalizes and validates with
  [McpServerConfig](McpServerConfig.md), refuses a taken name
  (`A server named "<name>" already exists`, case-insensitive), id is
  `<slug>-<6 random>`.
- `update(id, patch)`: merges, normalizes again (a transport change rewrites
  the right fields), checks the name, then validates. `Server not found` for
  an unknown id.
- `setEnabled(id, enabled)`: only the flag.
- `McpServerStore.STORAGE_KEY` (`'mcpConnector.servers'`).
