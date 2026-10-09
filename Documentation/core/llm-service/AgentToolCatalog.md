# AgentToolCatalog

`core/llm-service/AgentToolCatalog.js`

The single source of truth for which tools the host's chat agent can run.
Read by the agent bridge (prompt docs and routing), the chat settings toggles
(a denylist: on by default), scheduled tasks, triggers, agent-manager and the
Network Sharing allow-list, so they never drift.

## Methods (all static)

- `BASE_TOOL_GROUPS`: hand-wired groups `{ id, label, description, tools: [{ name, label }] }`
  (`browse`, `artifacts`, `images`, `video`, `music`, `web`, `knowledge_base`,
  `programmatic`). `browse` is built from `BrowserActions.chatToolEntries()`
  alone.
- `BASE_TOOL_NAMES`, `PROGRAMMATIC_TOOL_NAMES`, `FORGE_TOOL_NAMES`,
  `USER_TOOLS_SOURCE` (`'ext.user-tools'`).
- `getDynamicTools(mcpAggregator)`: aggregator tools no base group covers, as
  `{ name, description, inputSchema, source, mutating }`. Includes externally
  disabled tools (the agent gates on its own lists). First source wins.
- `getToolGroups(mcpAggregator)`: base groups (copied) plus one group per
  discovered source, labelled by [ExtensionDisplayName](tools/ExtensionDisplayName.md).
- `getAllToolNames(mcpAggregator)`: every name in `getToolGroups`; the router
  materializes the allowlist from it, so a tool missing here is uncallable.
- `seedDefaultOffAgentTools(settingsDb, names = PROGRAMMATIC_TOOL_NAMES)`:
  appends each name to `core.chat.disabledAgentTools` once ever (tracked in
  `core.chat.defaultOffToolsSeeded`); returns whether it wrote.

## Routing rules

- `core.browser` is a mirror source: it republishes the browser actions as
  `browser_click` etc. for MCP and REST clients. Offering both vocabularies
  made a model call names it was not allowed and burn its steps, so mirrors
  never reach the chat catalog. Exact base-name collisions are dropped too.
- Programmatic tools (`send_notification_ntfy`) join the `programmatic`
  group; forge builders (`create_tool`, `test_tool`, `publish_tool`) join
  `artifacts` with labels and `surfaceWhenDisabled: true`.
- Tools from `ext.user-tools` get the stable `user_created_tools` group, all
  `surfaceWhenDisabled`, so a disabled one stays visible unchecked.
