# TriggerRunLog

`core/llm-server/chat/trigger-store/TriggerRunLog.js`

A trigger's fire history (`llm_trigger_runs`) over
[TriggerRunRepository](TriggerRunRepository.md).

## Methods

- `TriggerRunLog.newId()`: `trun_...`.
- `start(triggerId, { conversationId?, kind = 'event', event?, dedupeKey?, attempt?, retryOf? })`:
  a `running` row; the event capped at `MAX_EVENT_CHARS` (64 K) with
  [CappedJson](CappedJson.md); `attempt` 1 unless a number above 1.
- `finish(runId, { status = 'ok', error?, response? })`: response cut to
  `MAX_RESPONSE_CHARS` (20000).
- `get(id)`, `list(triggerId, { limit = 50, offset = 0 })` (newest first, limit capped at 200).
- `hasDedupeKey(triggerId, key)`: false for an empty key.
- `conversationIds(triggerId)`: transcripts still referenced.
- `pruneTranscripts(triggerId, keep)`: detaches all but the newest `keep`
  transcripts and returns their conversation ids for the caller to delete.
  The run rows stay.
- `latestRealEvent(triggerId)`: `{ runId, event }` for the newest `event`-kind
  run that is not a batch, `catchUp` removed; `null` when none.
- `deleteForTrigger(triggerId)`.
