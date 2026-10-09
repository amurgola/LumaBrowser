import McpServersTab from './ui/McpServersTab.js';

if (!window.LumaSetupExt) {
  console.error('[mcp-connector] LumaSetupExt not present');
} else {
  window.LumaSetupExt.registerTab({ id: 'mcp-connector', label: 'MCP Servers', mount: (el, api) => new McpServersTab(el, api).mount() });
}
