# CancellableDelay

`core/llm-server/server/fit-test/CancellableDelay.js`

Waits for the fit test.

## Methods

- `CancellableDelay.sleep(ms)` a plain timer.
- `CancellableDelay.until(ms, shouldCancel)` resolves after `ms`, or at the next
  200 ms step once `shouldCancel()` is true (a throwing hook counts as false).
- `STEP_MS` (200).

## Why

The teardown settle wait is 2.5 s per combo; without the early exit Cancel would
look dead for that long on every rung.
