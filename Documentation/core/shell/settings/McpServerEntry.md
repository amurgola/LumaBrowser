# McpServerEntry

`core/shell/settings/McpServerEntry.js`

The MCP server entry an external client needs, and its export.

## Methods

- `McpServerEntry.build({ db, rootDir, isPackaged, apiSecurity? })` `{ command: 'node', args:
  [script], env: { LUMA_API_PORT: '<core.apiPort or 3000>' } }`, where the
  script is `<rootDir>/mcp-server.js` in development and
  `<rootDir>/../app.asar.unpacked/mcp-server.js` when packaged. While
  `apiSecurity` ([ApiSecurity](../ApiSecurity.md)) requires an API key and one
  exists, `env` also carries `LUMA_API_KEY: '<the first key>'`. It used to be
  left out, so every client the app set up was refused as soon as the user
  required a key, and showed no tools. With no key required the entry holds no
  secret.
- `McpServerEntry.clientConfig(entry)` `{ mcpServers: { 'luma-browser': entry } }`.
- `async McpServerEntry.exportConfig(entry, chooseSavePath)`:
  `{ success: false, canceled: true }` when the dialog is canceled, else writes
  the client config (2-space JSON) and returns `{ success: true, filePath }`.

## Why

In production the files are inside app.asar; asarUnpack extracts
mcp-server.js beside it so node can execute it. The same entry is written into
each coding harness's config by [AgentHarnessSettings](AgentHarnessSettings.md).
