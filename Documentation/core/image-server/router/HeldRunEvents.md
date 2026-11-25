# HeldRunEvents

`core/image-server/router/HeldRunEvents.js`

The `send` and `notify` of a render that may be retried: every event passes
straight through except the failure (the `error` event, a `done` that delivered
no image, and the error-level notification), which is held until [ImageRouter](../ImageRouter.md) knows
whether a retry follows ([ImageCapacityRescue](ImageCapacityRescue.md)).

## Methods

- `new HeldRunEvents(send, notify)`; use its `send` and `notify` properties.
- `release(result)`: sends what was held, returns `result` unchanged.
- `discard()`: drops what was held; the caller sees only the retry's outcome.
