# SharedLlmTurn

`core/network-sharing/host/llm/SharedLlmTurn.js`

Base class for one LLM turn a shared client runs through the host's chat
router. It owns the lifecycle; subclasses supply the wire format.
Implementations: [ChatCompletionTurn](ChatCompletionTurn.md),
[ResponsesTurn](ResponsesTurn.md).

## Methods

- `new Subclass(service, turns, ...)` (`turns`: the router's [LiveTurnRegistry](LiveTurnRegistry.md)).
- `run(req, res)`:
  1. `_validate()`: a `{ status, body }` refusal is sent as is and the turn ends.
  2. `_open()`: the subclass creates its ids and writer.
  3. Watches `res` `close` (a client disconnect): cancels with `socketGone`, banks usage.
  4. Registers the turn under its id ([LiveTurnRegistry.turnIdOf](LiveTurnRegistry.md)) for explicit abort.
  5. `_beforeDispatch()` (optional), then `_startProxy()`; a turn cancelled
     while dispatching aborts the handle as soon as it arrives; a thrown
     dispatch goes to `_fail`.
- Hook targets for subclasses: `_complete(summary)` (onDone), `_fail(err)`
  (onError), `_cancel({ socketGone })`, plus `this._meter`
  ([TurnUsageMeter](TurnUsageMeter.md)) and `this._wantStream`.
- Subclass contract (the base throws `<Class> must implement <step>(...)`):
  `_validate`, `_open`, `_startProxy`, `_completedBody(summary)`,
  `_cancelledBody()`, `_errorBody(message)`, `_streamCompleted(summary)`,
  `_streamCancelled()`, `_streamFailed(message)`; optional `_warnLabel()`.

## Behaviour

- Done: banks usage once; streaming writes the closing frames and ends;
  non-streaming answers `_completedBody` JSON if headers are not sent.
- Error: banks usage; before any output it answers 502 `_errorBody`;
  mid-stream it writes `_streamFailed`, ends, and warns `[sharing] <label>:`.
- Cancel (abort endpoint or disconnect): once only, never after a clean end;
  unregisters, aborts the handle, banks usage; on disconnect nothing more is
  written; otherwise `_cancelledBody` JSON or `_streamCancelled` frames.

## Why

`cancelled` is kept apart from `ended`, so a turn that finished cleanly before
its handle resolved is never aborted after the fact (a local abort marks the
slot dirty). A client disconnect is the RESPONSE closing early: `req` `close`
fires once the body is read, so it is not used. The adapters suppress their
callbacks after an abort, so cancel closes the response itself.
