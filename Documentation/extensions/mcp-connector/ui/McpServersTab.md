# McpServersTab

`extensions/mcp-connector/ui/McpServersTab.js`

The "MCP Servers" tab: configured external MCP servers with live status and
discovered tools, and an add/edit form.

## Methods

- `new McpServersTab(el, api)`, `mount()`: injects `<link id="mcpc-css">`, refreshes.
- `refresh()`: `list`; failure shows "Failed to load servers: <message>".
- `openForm(server | null)`, `closeForm()`.
- `toggleServer(id, enabled)`, `reconnect(id)`, `deleteServer(id, name)`
  (confirmed): refresh after; a failure alerts "Failed: ", "Reconnect failed: "
  or "Delete failed: " plus the message.
- `saveForm(form)`: [McpServerForm](McpServerForm.md)`.collect`; shows
  "Connecting..." while saving; `update` for an existing server, else
  `create`; a failure shows inline and restores the button.

## Bug fixed

Legacy turned the form's `editing` into `{ name, enabled, transport }` on a
transport switch, so switching transport while ADDING a server made the form
say "Edit server" and save with `update({ id: undefined })`. Edit versus
create now keys off the record's id (test: "switching a NEW server to HTTP ...").
