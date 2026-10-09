# TriggerGatingParams

`core/llm-server/chat/trigger-mode/TriggerGatingParams.js`

Maps the setup tools' gating and policy parameters onto trigger source keys.
Shared by [TriggerCreateSource](TriggerCreateSource.md) and
[TriggerUpdatePatch](TriggerUpdatePatch.md).

## Methods (static)

- `toSource(params)` returns only the keys whose parameter was passed; `null`
  clears a key in the store:

| Parameter | Source key |
|---|---|
| `filter` | `filter` (empty or non-object -> `null`) |
| `cooldown_seconds` | `cooldownMs` (0 -> `null`) |
| `batch_seconds` (+ `batch_max`) | `batch: { windowMs, max }` (0 -> `null`) |
| `batch_max` alone | `batch: { keepWindow: true, max }` |
| `quiet_hours` | `quietHours` |
| `auto_pause_after`, `retry_max` | `autoPauseAfter`, `retryMax` (non-negative integers; `null` -> `null`) |
| `notify_failures` | `notifyFailures: false`, or `null` (default) |
| `retry_backoff_seconds` | `retryBackoffMs` (0 -> `null`) |
| `bot_guard` | `botGuard: false`, or `null` (default) |
| `memory` (+ `memory_runs`) | `memory: { runs, keepRuns }` or `null` |
| `memory_runs` alone | `memory: { runs, runsOnly: true }` |
| `approval` | `'ask'` or `null` |
| `approved_tools` | the list, or `null` when empty |

  The `keepWindow`, `keepRuns` and `runsOnly` markers need the current source:
  create drops `keepWindow` and `runsOnly`; update resolves them.
- `quietHoursError(source)`: `quiet_hours needs start and end as "HH:MM"
  (different from each other)` when `source.quietHours` is set but
  `QuietHours.normalize` rejects it, else `null`.
