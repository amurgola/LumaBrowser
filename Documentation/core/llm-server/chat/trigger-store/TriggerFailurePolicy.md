# TriggerFailurePolicy

`core/llm-server/chat/trigger-store/TriggerFailurePolicy.js`

A trigger's failure policy. Extends [TriggerPolicy](TriggerPolicy.md).

## Methods

- `normalizeInto(source, out)`: stores `autoPauseAfter` (0 .. 100; 0 never
  pauses), `notifyFailures: false` only when off, `retryMax` (0 .. 5),
  `retryBackoffMs` (5 s .. 1 h), each only when it differs from its default
  (compared before clamping).
- `of(trigger)` returns `{ autoPauseAfter, notifyFailures, retryMax, retryBackoffMs }`
  with defaults `DEFAULT_AUTO_PAUSE_AFTER` (3), `true`, `DEFAULT_RETRY_MAX` (1),
  `DEFAULT_RETRY_BACKOFF_MS` (30 s).

## Why

Pause after N consecutive failed real runs, notify the desktop on the first
failure after a success, and retry runtime failures with backoff before they
count. Applied by [FailureStreak](FailureStreak.md) and TriggerRunner.
