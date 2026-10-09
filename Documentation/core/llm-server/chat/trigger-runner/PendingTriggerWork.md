# PendingTriggerWork

`core/llm-server/chat/trigger-runner/PendingTriggerWork.js`

Base class for trigger work the runner holds on a timer before it reaches the
run queue: [TriggerBatchWindows](TriggerBatchWindows.md),
[QuietHoursHold](QuietHoursHold.md) and
[TriggerRetryScheduler](TriggerRetryScheduler.md). At most one entry per
trigger, released into the queue later, dropped and logged on shutdown.

## Methods

- `new Subclass({ triggerStore, logger, emitEvent?, enqueue, isStopped })`.
  `enqueue(trigger, event, options)` is TriggerRunner's queue entry and returns
  `{ done }`; `isStopped()` is the runner's state; `logger` is a
  [TriggerDeliveryLogger](TriggerDeliveryLogger.md).
- `has(triggerId)`.
- `dropAll()`: clears every timer and calls the subclass `_drop(triggerId,
  entry)`, which logs a `dropped` row with an `app shutting down (...)` detail
  and settles the entry's waiters with null.
- Protected helpers: `_startTimer(entry, delayMs, onFire)` (unref'd),
  `_take(triggerId)`, `PendingTriggerWork._deferred()`.
