# TriggerCardData

`core/llm-server/ui/js/triggers/TriggerCardData.js`

Loads the open conversation's trigger: the `api.triggers.list()` entry for
the conversation, then `get(id)` (base URLs, watch, secret, pending, versions,
agent) and the last five `deliveries`.

## Methods

- `load(api, conversationId)` resolves `{ trigger, details }` (details `null`
  when only the list entry could be read) or `null`.
