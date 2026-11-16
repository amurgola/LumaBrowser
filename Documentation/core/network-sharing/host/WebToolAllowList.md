# WebToolAllowList

`core/network-sharing/host/WebToolAllowList.js`

The host's allow-list of agent tools a shared chat client may use (web PWA and
paired clients), validated against [AgentToolCatalog](../../llm-service/AgentToolCatalog.md).

## Methods

- `new WebToolAllowList({ settings, mcpAggregator })`: `settings` is
  [HostSettings](HostSettings.md); `mcpAggregator` (optional) adds extension tools to the catalog.
- `get()`: the host's own choice: `null` while nothing was chosen, else the
  stored names still in the catalog.
- `defaults()`: what applies while nothing was chosen: the built-in tool groups
  of the catalog except `vault` and `programmatic`
  (`WebToolAllowList.WITHHELD_BY_DEFAULT_GROUPS`).
- `forSharedTurn()`: the tools a shared turn with no agent in charge runs with:
  `get()` or `defaults()`, minus the tools the host switched off for its own
  chat (`HostSettings.getGloballyDisabledTools`).
- `set(tools)`: a non-array forgets the choice (`{ success: true,
  webAllowedTools: null }`, back to the defaults); otherwise stores the known
  names in catalog order.
- `toolGroups()`: `AgentToolCatalog.getToolGroups(mcpAggregator)` for the settings UI.

## Why

A shared turn runs for someone else and nothing on the host asks before a tool
runs, so "nothing chosen" must not mean "everything". It used to: a paired
client got every tool but the terminal, desktop control, connected MCP servers
and outbound webhooks included, and the host's own switched-off tools were not
honoured.

The defaults are the built-in chat tools the web app and paired clients already
use (browsing, artifacts, images, video, music, web search, the knowledge
base), so clients in the field keep working. Extension tools, connected MCP
servers, outbound calls and saved logins wait for the host to tick them. A list
the host saved earlier is honoured exactly as it was, and an agent the host
shares keeps the grant the host gave it (see
[ChatTurnInputs](llm/ChatTurnInputs.md)).

Names of removed tools or uninstalled extensions drop out on read.
