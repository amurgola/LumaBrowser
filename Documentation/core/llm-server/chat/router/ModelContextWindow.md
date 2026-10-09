# ModelContextWindow

`core/llm-server/chat/router/ModelContextWindow.js`

The context window ONE request gets from the model behind a chat model ref, in tokens.

## Methods

- `new ModelContextWindow({ llmServerService, db })`.
- `forRef(ref)`: local refs -> `localPerSlot()`; a remote ref -> the floored `luma_context` of its model entry in `llm.providerConfigs`; null otherwise (unknown config, no separator, empty provider id, not a string).
- `localPerSlot()`: `llmServerService.getEffectiveContext().ctxPerSlot` when positive, else null (also when the service is missing or throws).

## Why

Bug M4: the meter, the compaction trigger and the agent's tool budgets each divided the persisted request, ignoring the planner's clamp and its slot downgrade. A paired peer's model runs in the HOST's server, so this machine's local settings say nothing about it; the host advertises `luma_context` instead.
