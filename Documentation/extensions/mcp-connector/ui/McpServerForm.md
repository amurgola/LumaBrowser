# McpServerForm

`extensions/mcp-connector/ui/McpServerForm.js`

## Methods

- `McpServerForm.render(server, transport, on)`: title "Edit server" (record
  with an id) or "Add MCP server"; name; transport select (stdio, Streamable
  HTTP, SSE); the stdio group (command, args, working dir, env) or the HTTP
  group (URL, headers); Enabled; Cancel and Save/Add server. A transport change
  calls `on.transportChanged({ name, enabled, transport })`.
- `McpServerForm.collect(form)`: `{ patch }` (`name, transport, enabled`
  plus `command, args (raw string, the store tokenizes), env, cwd` or `url,
  headers`) or `{ error }`: "Name is required.", "A command is required for
  a stdio server.", "A URL is required.".
- `McpServerForm.saveLabel(server)`.
