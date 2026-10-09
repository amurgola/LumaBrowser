# AgentHarnessSettings

`core/shell/settings/AgentHarnessSettings.js`

"Connect your agent" for Settings: points Claude Code, Codex, OpenCode and
Cline at the Local API and the MCP server through
[HarnessConnections](../harness-connections/HarnessConnections.md).

## Methods

- `new AgentHarnessSettings({ db, mcpEntry, createConnections?, localApi? })`;
  `mcpEntry()` returns the [McpServerEntry](McpServerEntry.md); `localApi`
  defaults to the [LocalApiServer](../../llm-server/server/LocalApiServer.md)
  class (statics `PORT_KEY`, `DEFAULT_PORT`, `ENABLED_KEY`, `BIND_HOST`), loaded
  on first use.
- `list()` `{ success: true, harnesses, skills, localApiEnabled }`.
- `connect(id)`, `disconnect(id)` (id stringified), `writeSkills()`: the
  HarnessConnections result. Any throw becomes `{ success: false, error }`
  (`harness operation failed` without a message).
- `preview(id, action = 'connect')` `{ success: true, harness, action, files, kept }`:
  what connect or disconnect would change, per file the text before and after,
  with nothing written (not yet wired to an IPC channel).
- `localApiEnabled()` the Local API's enabled flag.
- `endpoints()` `{ openaiBaseUrl: 'http://<BIND_HOST>:<port>/v1',
  anthropicBaseUrl: 'http://<BIND_HOST>:<port>', mcp }`; a saved port that is
  not an integer in 1-65535 falls back to the default.
- `model()` the basename (without extension) of
  `core.llmServer.defaults.modelPath`, or null.

## Why

HarnessConnections is built on first use (the settings panel is the only
caller) with live `getEndpoints` and `getModel` getters, so a changed port or
model is picked up on the next connect. Its files are placed by
`HarnessConnections.paths()` under the app base dir.
