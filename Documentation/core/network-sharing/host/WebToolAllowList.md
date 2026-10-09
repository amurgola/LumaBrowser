# WebToolAllowList

`core/network-sharing/host/WebToolAllowList.js`

The host's allow-list of agent tools a shared chat client may use (web PWA and
paired clients), validated against [AgentToolCatalog](../../llm-service/AgentToolCatalog.md).

## Methods

- `new WebToolAllowList({ settings, mcpAggregator })`: `settings` is
  [HostSettings](HostSettings.md); `mcpAggregator` (optional) adds extension tools to the catalog.
- `get()`: `null` (no restriction) when unset, else the stored names still in the catalog.
- `set(tools)`: a non-array clears the restriction (`{ success: true,
  webAllowedTools: null }`); otherwise stores the known names in catalog order.
- `toolGroups()`: `AgentToolCatalog.getToolGroups(mcpAggregator)` for the settings UI.

## Why

`null` means the full toolset, so an existing install keeps its behaviour and a
tool added later is allowed until the host customises the list. Names of
removed tools or uninstalled extensions drop out on read.
