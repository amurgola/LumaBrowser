# HarnessConnectionsPanel

`ui/shell/settings/security/HarnessConnectionsPanel.js`

"Connect your agent" rows (Claude Code, Codex, OpenCode, Cline), the luma skill install and MCP export; reloads on gear click.

## Methods

- `install()`, `load()`.
- `describe(h)`, `rowHtml(h)`, `skillText(skills)`, `disconnectMessage(r)` (static).
  `disconnectMessage` names the settings the user changed after connecting, which
  disconnect left in place.

## Globals

Reads `window.electronAPI.harness*`, `exportMcpConfig`.
