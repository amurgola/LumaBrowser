# HarnessConnectionsPanel

`ui/shell/settings/security/HarnessConnectionsPanel.js`

"Connect your agent" rows (Claude Code, Codex, OpenCode, Cline): the agent name with its status as help text on the left (green when connected, amber when it needs repair) and the Connect/Disconnect button right-aligned. Also the luma skill install and MCP export; loads on every `settings:open` event
(not at shell boot: the listing scans PATH for each harness executable on the
main thread, which is work the first paint should not pay for).

## Methods

- `install()`, `load()`.
- `describe(h)`, `rowHtml(h)`, `skillText(skills)`, `disconnectMessage(r)` (static).
  `disconnectMessage` names the settings the user changed after connecting, which
  disconnect left in place.

## Globals

Reads `window.electronAPI.harness*`, `exportMcpConfig`.
