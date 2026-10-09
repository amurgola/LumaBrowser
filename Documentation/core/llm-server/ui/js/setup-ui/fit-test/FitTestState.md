# FitTestState

`core/llm-server/ui/js/setup-ui/fit-test/FitTestState.js`

Fit-test state per model path plus the single-flight lock and event route; folds streamed events, the invoke result and live or stored results into it.

## Methods

- `get(path)`, `ensure(path)`, `isRunning(path)`, `begin(path)`, `fail(path, message)`, `reconcile(path, res)` (true when applied), `applyEvent(type, payload)` (false without a route), `adoptLive(live)`, `adoptStored(results)`.

## Globals

None.
