# AgentToolPolicy

`core/llm-server/chat/router/AgentToolPolicy.js`

The user's agent-tool policy: the global denylist plus a conversation's gear-panel denylist as an allow-list, the gear panel's catalog, and its opt-in toggle channel.

## Methods

- `new AgentToolPolicy({ db, chatStore, getAgentDeps })`.
- `allowedFor(convId, deps = null)`: null when neither `DISABLED_SETTING` (`core.chat.disabledAgentTools`) nor the conversation's `disabledTools` disables anything; else `AgentToolCatalog.getAllToolNames(mcpAggregator)` minus both. Re-read on every call (the bridge refreshes mid-run). A failing conversation read degrades to the global list; any other failure to null.
- `globalAllowList(deps)`: the global denylist alone, or null.
- `catalog()`: `{ success: true, groups, disabled }`; a throwing db reads as `[]`.
- `setGlobalEnabled(name, enabled)`: only for catalog entries with `surfaceWhenDisabled`; returns `{ success, disabled }` or `{ success: false, error }` (`tool name required`, `Tool "x" cannot be toggled through this channel.`, or the write error).

## Why

An empty denylist means every tool on, so a newly installed extension's tools are auto-enabled. The toggle channel is restricted so it never becomes a general settings editor.
