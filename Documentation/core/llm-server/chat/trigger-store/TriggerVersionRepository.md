# TriggerVersionRepository

`core/llm-server/chat/trigger-store/TriggerVersionRepository.js`

Plain SQL over `llm_trigger_versions`; returns raw rows.

## Methods

`insert(row)`, `list(triggerId)` (newest first), `latest(triggerId)`,
`get(triggerId, n)`, `setWasArmed(id, 0|1)`,
`markTested(triggerId, configHash, testAt, testRunId)` (every version with that
hash), `prune(triggerId, keep)` (keeps the newest `keep`), `deleteForTrigger(triggerId)`.
