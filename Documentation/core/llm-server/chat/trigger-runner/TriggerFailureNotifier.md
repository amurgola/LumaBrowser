# TriggerFailureNotifier

`core/llm-server/chat/trigger-runner/TriggerFailureNotifier.js`

The failure policy after a real fire. The store counts the streak and pauses
at the threshold ([FailureStreak](../trigger-store/FailureStreak.md)); the user
is told once per streak (its first failure) and again when the trigger pauses,
never on every repeat.

## Methods

- `new TriggerFailureNotifier({ triggerStore, emitEvent?, notify? })`.
- `afterFire(trigger, status, errorText)`: `recordFire` and returns its
  result. On an auto-pause emits `auto-paused` and `triggers-changed` and
  notifies `Trigger paused: <title>` with the pause reason; on the first failure
  of a streak notifies `Trigger run failed: <title>` with the error (200
  characters) plus ` (pauses after N in a row)` when auto-pause is on. Both
  notifications respect the trigger's `notifyFailures`.
