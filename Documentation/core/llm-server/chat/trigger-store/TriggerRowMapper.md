# TriggerRowMapper

`core/llm-server/chat/trigger-store/TriggerRowMapper.js`

Turns raw trigger-table rows into the camelCase objects callers use.

## Methods

- `TriggerRowMapper.trigger(row)`: `{ id, conversationId, title, kind,
  hookToken, source, action, sample, lastTest, enabled, fireCount,
  lastFiredAt, lastStatus, consecutiveFailures, pausedReason, lastDrift,
  memory, memoryAt, createdAt, updatedAt, status, armable }`.
- `TriggerRowMapper.run(row)`: `{ id, triggerId, conversationId, kind,
  status, startedAt, completedAt, error, response, event, dedupeKey, attempt, retryOf }`.
- `TriggerRowMapper.delivery(row)`: `{ id, triggerId, at, source, outcome,
  detail, runId, dedupeKey, remote, event }`.
- `TriggerRowMapper.version(row)`: `{ n, triggerId, at, origin, action,
  configHash, tested, testAt, wasArmed, note, current: false }`.

JSON columns parse with [JsonColumn](../../../database/JsonColumn.md);
unparseable optional columns become `null`, source and action `{}`.
