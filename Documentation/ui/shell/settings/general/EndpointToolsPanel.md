# EndpointToolsPanel

`ui/shell/settings/general/EndpointToolsPanel.js`

The API & MCP allow-list and the chat agent tool list, saved together as deny-lists; announces `agent-tools:changed`.

## Methods

- `install()`, `load()`, `save()`.
- `EndpointToolsPanel.visibleAgentGroups(groups, activeExtIds)`.

## Globals

Reads `window.electronAPI.getAvailableEndpoints`, `setEndpointConfig`, `window.ipcBridge.getExtensions`.
