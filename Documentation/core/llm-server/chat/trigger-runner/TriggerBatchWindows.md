# TriggerBatchWindows

`core/llm-server/chat/trigger-runner/TriggerBatchWindows.js`

Batch gating for triggers with `source.batch` (`{ windowMs, max }`, see
[TriggerGating](../triggers/TriggerGating.md)). Extends
[PendingTriggerWork](PendingTriggerWork.md).

## Methods

- `add(trigger, event, { deliveryId, dedupeKey })`: opens the window on the
  first event, moves the delivery row to `batched` (`batch N/max, window S s`),
  emits `batched`, and flushes early at `max`. Returns the shared promise of the
  batch run (every collected fire settles with the same run).
- `depth(triggerId)`: events collected so far.
- Flush: builds `TriggerGating.buildBatchEvent(events, { windowMs, reason })`
  (`reason` `window` or `max`) and enqueues one `event` run carrying every
  delivery id. A trigger deleted (or a runner stopped) meanwhile settles the
  waiters with null.
- Shutdown: `dropped` / `app shutting down (batch not run)`.
