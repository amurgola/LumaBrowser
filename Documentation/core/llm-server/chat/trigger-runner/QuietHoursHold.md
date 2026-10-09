# QuietHoursHold

`core/llm-server/chat/trigger-runner/QuietHoursHold.js`

Quiet hours in `defer` mode (see [QuietHours](../triggers/QuietHours.md)):
events arriving inside a trigger's quiet window are held, their delivery rows
staying `deferred`, and released into the run queue in arrival order when the
window ends. Extends [PendingTriggerWork](PendingTriggerWork.md).

## Methods

- `add(trigger, event, { dedupeKey, source, remote, resumesAt, deliveryId })`:
  holds the event until `resumesAt` (a Date, at least 1 s away). A different
  `resumesAt` (the config changed) re-arms the timer and keeps what is held.
  Beyond `QuietHours.MAX_DEFERRED` the oldest is dropped (`quiet-hours hold full
  (N)`). Emits `deferred`; returns the promise of the event's run.
- `status(triggerId)`: `{ count, resumesAt }` or null.
- Release: each held event is enqueued with its own delivery id; a trigger
  paused or deleted meanwhile drops them (`trigger paused during quiet hours`,
  `trigger deleted during quiet hours`). Emits `released` with the count.
- Shutdown: `app shutting down (held for quiet hours)`.
