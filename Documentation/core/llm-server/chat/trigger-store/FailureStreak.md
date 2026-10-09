# FailureStreak

`core/llm-server/chat/trigger-store/FailureStreak.js`

Applies a trigger's [TriggerFailurePolicy](TriggerFailurePolicy.md) to one finished real run.

## Methods

- `FailureStreak.after(trigger, { status, error })` returns
  `{ failed, consecutiveFailures, firstFailure, autoPaused, pausedReason }`.
  `status === 'error'` extends the streak, anything else resets it to 0. An
  armed trigger at or past a positive `autoPauseAfter` is paused with
  `paused automatically after <n> consecutive failed run(s); last: <error, 200 chars>`.

## Why

A run while already paused (a manual run) never pauses again, because only an
armed trigger can be paused. [TriggerStore](../TriggerStore.md)`.recordFire`
writes the outcome and drops `failed` from its result.
