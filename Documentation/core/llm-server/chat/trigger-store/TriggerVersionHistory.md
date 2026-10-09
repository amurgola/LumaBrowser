# TriggerVersionHistory

`core/llm-server/chat/trigger-store/TriggerVersionHistory.js`

A trigger's instruction history (`llm_trigger_versions`) over
[TriggerVersionRepository](TriggerVersionRepository.md).

## Methods

- `record(trigger, origin = 'edit', note = null, prevArmed = false)`: appends a
  version for the trigger's current action unless it equals the newest one
  (then returns that). The superseded version is stamped `wasArmed =
  prevArmed`; the new one is `tested` when the trigger's last passing test
  matches its config hash. Note cut to 200 chars; the newest `KEEP` (10) survive.
- `list(triggerId)`: newest first, the first with `current: true`.
- `info(triggerId)`: `{ current, count, previousTested }` (the newest earlier tested version).
- `find(triggerId, n)`: the raw stored row (with `test_run_id`), or `null`.
- `markTested(triggerId, configHash, testAt, testRunId)`, `deleteForTrigger(triggerId)`.
- `originOf(origin)`: one of `ORIGINS` (`create`, `edit`, `chat`, `rollback`), else `edit`.

## Why

`wasArmed` on a superseded version is the state a rollback to it restores, and
`previousTested` is the one-click way back after a bad edit.
