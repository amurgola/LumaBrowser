# TriggerForm

`core/llm-server/ui/js/triggers/TriggerForm.js`

The trigger setup form and the opening turn a submitted form becomes.

## Methods

- `SCHEMA`, `INITIAL`.
- `schemaFor(agents, tabs)`: the persisted-tab select before Site and the agent
  select after Action, only when there is something to pick; else `SCHEMA`.
- `agentField(agents)`, `tabField(tabs)`.
- `openingTurn(data, { agents, tabs })`: source lines per kind (webhook, file,
  page, notification), action, configured agent, webhook response.
