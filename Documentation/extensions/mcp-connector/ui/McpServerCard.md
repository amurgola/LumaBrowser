# McpServerCard

`extensions/mcp-connector/ui/McpServerCard.js`

## Methods

- `McpServerCard.render(server, on)`: name, status badge (`STATUS_BADGE`
  variant, `STATUS_LABEL` text), transport chip, "N tool(s)" when connected,
  the target line, the error line, escaped tool chips (description as title)
  or "No tools exposed." when connected without tools; Enable/Disable,
  Reconnect (disabled when the server is disabled), Edit, Remove.
- `McpServerCard.target(server)`: `command args...` for stdio, else the URL.
