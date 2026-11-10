# EndpointToolsPanel

`ui/shell/settings/general/EndpointToolsPanel.js`

The API & MCP allow-list and the chat agent tool list, saved together as deny-lists; announces `agent-tools:changed`. Each list sits in a fold group ([FoldGroups](FoldGroups.md) keys `api-tools` and `agent-tools`) whose summary line counts what is on, updated on load and on every save.

## Methods

- `install()`, `load()`, `save()`.
- `EndpointToolsPanel.visibleAgentGroups(groups, activeExtIds)`.

## Globals

Reads `window.electronAPI.getAvailableEndpoints`, `setEndpointConfig`, `window.ipcBridge.getExtensions`.
