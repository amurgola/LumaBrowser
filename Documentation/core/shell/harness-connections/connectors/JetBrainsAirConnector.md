# JetBrainsAirConnector

`core/shell/harness-connections/connectors/JetBrainsAirConnector.js`

Connects JetBrains Air, the agent surface of the 2026.3 IDEs and the Air app
(`id: 'jetbrains-air'`, no executable, JSON).

## Plan

- `~/.jetbrains/acp.json`: `agent_servers.LumaBrowser = { command, args, env, use_idea_mcp: false, use_custom_mcp: false }`
  from `endpoints.acp` ([AcpAgentEntry](../../settings/AcpAgentEntry.md)): Air starts
  `luma acp` over stdio and shows LumaBrowser in its agent picker.
- `~/.jetbrains/mcp/mcp.json`: `mcpServers.luma-browser = { command, args, env }`
  from `endpoints.mcp`, so Air's other agents get the browser and desktop tools.

Without `endpoints.acp` (a build with no CLI) `plan` throws and connect fails.

## Ownership and detection

- Connected while the agent entry still runs our command with our args; a user may
  add env or MCP flags to it and it stays ours.
- `detectInstalled(paths)`: a `~/.jetbrains` folder, or an `air.*.xml` options file
  in any IDE folder under `paths.jetbrainsIdeConfigs` (`%APPDATA%\JetBrains`,
  `~/Library/Application Support/JetBrains`, `~/.config/JetBrains`).
