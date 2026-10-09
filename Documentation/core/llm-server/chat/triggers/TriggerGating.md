# TriggerGating

`core/llm-server/chat/triggers/TriggerGating.js`

The cheap decisions made before a trigger event costs a model turn, and the
normalisation of their settings so the trigger store, the trigger mode and the
UI agree on limits and defaults.

## Gates

- **filter**: dotted-path rules over the event, see [TriggerFilter](TriggerFilter.md).
- **cooldown**: refuse events arriving within `cooldownMs` of the last
  accepted one (per trigger). Enforced by the trigger runner.
- **batch**: collect events for `windowMs` or until `max` arrive, then run once
  with the event from `buildBatchEvent`. Enforced by the trigger runner.

## Methods

- `TriggerGating.normalize(source)` returns the gating keys of a trigger
  source: `{ filter?, cooldownMs?, batch? }`, each present only when that gate
  is on.
- `TriggerGating.normalizeCooldownMs(value)` returns 0 (off) for non-positive or
  non-numeric input, otherwise clamps to 1 s .. 24 h.
- `TriggerGating.normalizeBatch(batch)` returns `{ windowMs, max }` or `null`
  without a positive window. The window clamps to 2 s .. 1 h; `max` defaults to
  25 and caps at 200.
- `TriggerGating.buildBatchEvent(events, { windowMs, reason })` returns
  `{ receivedAt, event: 'batch', count, windowMs, reason, firstAt, lastAt, events }`;
  `reason` defaults to `'window'` (the runner passes `'max'` for an early flush).
- `TriggerGating.describe(gating)` returns one line such as
  `filter: 1 rule · cooldown 30 s · batch 60 s / 10`, or `''`.
- Constants: `MIN_COOLDOWN_MS`, `MAX_COOLDOWN_MS`, `MIN_BATCH_WINDOW_MS`,
  `MAX_BATCH_WINDOW_MS`, `MAX_BATCH_SIZE`, `DEFAULT_BATCH_MAX`.
