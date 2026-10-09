# TriggerRepository

`core/llm-server/chat/trigger-store/TriggerRepository.js`

Plain SQL over `llm_triggers`; returns raw rows.

## Methods

`insert(row)`, `get(id)`, `getByToken(token)`, `list()` (newest first),
`listWithRunCounts()` (adds `run_count`), `listByConversation(id)` (oldest
first), `delete(id)` (boolean), `updateConfig({ id, title, source, action,
enabled, updated_at, clear_pause })`, `restoreTest({ id, last_test, enabled,
updated_at, clear_pause })`, `setLastTest(id, json, at)`,
`setSample(id, json, at)` (also clears `last_drift`), `setDrift(id, json, at)`,
`setMemory(id, notes, memoryAt, at)`, `recordFire({ id, at, status, streak,
auto_paused, paused_reason, succeeded })`. Flags are 0/1; `clear_pause` resets
`paused_reason` and `consecutive_failures`; `recordFire` sets the reason when
paused and clears it after a success.
