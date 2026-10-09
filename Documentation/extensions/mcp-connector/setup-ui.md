# setup-ui.js (mcp-connector entry)

`extensions/mcp-connector/setup-ui.js`, `extensions/mcp-connector/setup-ui.css`

The "MCP Servers" Setup-tab entry, loaded as a module: registers
`{ id: 'mcp-connector', label: 'MCP Servers', mount }` with
`window.LumaSetupExt`, mounting [McpServersTab](ui/McpServersTab.md); logs
"[mcp-connector] LumaSetupExt not present" without the host. The manifest's
`setupTab.assets` lists the `ui/` modules for the asset gate.
`setup-ui.css` is unchanged apart from the header em-dash.
