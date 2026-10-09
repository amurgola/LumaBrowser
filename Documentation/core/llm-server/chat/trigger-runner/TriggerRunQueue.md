# TriggerRunQueue

`core/llm-server/chat/trigger-runner/TriggerRunQueue.js`

The trigger runner's pending fires: one global FIFO with a per-trigger bound
(`DEPTH`, 20). Events are not "due" like scheduled tasks, they arrive, so they
queue instead of being dropped to the next tick.

## Methods

- `new TriggerRunQueue({ logger, emitEvent? })`.
- `makeRoom(trigger)`: call before `push`. When the trigger already has
  `DEPTH` pending fires the oldest is removed, its delivery rows move to
  `queue_dropped` (`queue full (20)`), its promise settles with null and
  `queue-dropped` is emitted.
- `push(item)`, `shift()`, `takeAll()` (empties the queue), `length`,
  `depth(triggerId)`.

Items are `{ triggerId, event, kind, dedupeKey, resolve, deliveryId,
deliveryIds, attempt, retryOf, source, resolvers }`.
