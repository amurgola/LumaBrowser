# EndpointSettings

`core/shell/settings/EndpointSettings.js`

Which REST route groups, MCP tools and in-app agent tools are switched off.

## Methods

- `new EndpointSettings({ db, restGateway, mcpAggregator })`.
- `getAvailable()` `{ apiGroups, mcpTools, disabledApiGroups, disabledMcpTools,
  agentTools, disabledAgentTools }`: the gateway's route groups, the
  aggregator's tool list, [AgentToolCatalog](../../llm-service/AgentToolCatalog.md)`.getToolGroups`,
  and the three stored lists (`core.disabledApiGroups`, `core.disabledMcpTools`,
  `core.chat.disabledAgentTools`, each default `[]`).
- `setConfig({ disabledApiGroups?, disabledMcpTools?, disabledAgentTools? })`
  applies each list that is an array and returns `{ success: true }`:
  - API groups are stored, then every `source: 'extension'` group is disabled
    or enabled on the gateway by its id without the `ext.` prefix;
  - MCP tools are stored and handed to `mcpAggregator.setDisabledTools`;
  - agent tools are only stored.

## Why

Agent tools are a denylist, so newly installed extension tools are enabled for
the agent automatically. They need no live poke: the chat router reads the list
on its next Tools-on turn.
