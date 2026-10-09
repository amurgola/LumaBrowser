# TriggerRetryScheduler

`core/llm-server/chat/trigger-runner/TriggerRetryScheduler.js`

Retries a failed real run after a jittered exponential backoff (the trigger's
`retryMax` / `retryBackoffMs`, see
[TriggerFailurePolicy](../trigger-store/TriggerFailurePolicy.md)). Extends
[PendingTriggerWork](PendingTriggerWork.md). The whole chain counts as one
fire: the failure policy only sees its final outcome.

## Methods

- `TriggerRetryScheduler.backoffMs(base, attempt)`: base, 2x, 4x ... with
  +/-20% jitter, never under 1 s.
- `TriggerRetryScheduler.retryable(errorText, shapeError)`: runtime failures
  yes, a wrong-shape result no (same prompt, same odds).
- `schedule(trigger, event, { attempt, runId, dedupeKey, source, resolvers,
  errorText })`: returns the delay, or null when `attempt > retryMax` or a chain
  is already pending for the trigger. Logs a `retry_scheduled` row (`retry
  N/max in S s after: <error>`) and emits `retry-scheduled`. When the timer
  fires the attempt is enqueued with `attempt + 1`, `retryOf` and the earlier
  waiters, reusing that delivery row; a trigger paused or deleted first drops it.
- `pending(triggerId)`: `{ at, attempt, of }` or null.
- Shutdown: `app shutting down (retry not run)`.
