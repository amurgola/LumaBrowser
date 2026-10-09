# McpServerEntry

`core/shell/settings/McpServerEntry.js`

The MCP server entry an external client needs, and its export.

## Methods

- `McpServerEntry.build({ db, rootDir, isPackaged })` `{ command: 'node', args:
  [script], env: { LUMA_API_PORT: '<core.apiPort or 3000>' } }`, where the
  script is `<rootDir>/mcp-server.js` in development and
  `<rootDir>/../app.asar.unpacked/mcp-server.js` when packaged.
- `McpServerEntry.clientConfig(entry)` `{ mcpServers: { 'luma-browser': entry } }`.
- `async McpServerEntry.exportConfig(entry, chooseSavePath)`:
  `{ success: false, canceled: true }` when the dialog is canceled, else writes
  the client config (2-space JSON) and returns `{ success: true, filePath }`.

## Why

In production the files are inside app.asar; asarUnpack extracts
mcp-server.js beside it so node can execute it. The same entry is written into
each coding harness's config by [AgentHarnessSettings](AgentHarnessSettings.md).
