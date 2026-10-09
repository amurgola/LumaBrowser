# TriggerRunRepository

`core/llm-server/chat/trigger-store/TriggerRunRepository.js`

Plain SQL over `llm_trigger_runs`; returns raw rows.

## Methods

`insert(row)`, `finish(id, status, completedAt, error, response)`, `get(id)`,
`list(triggerId, limit, offset)` (newest first), `hasDedupeKey(triggerId, key)`,
`conversationIds(triggerId)`, `withConversationBeyond(triggerId, keep)` (runs
still owning a transcript, skipping the newest `keep`), `clearConversation(id)`,
`deleteForTrigger(triggerId)`.
