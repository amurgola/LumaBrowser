# RunControl

`core/llm-server/chat/bridge/turn/RunControl.js`

One run's cancel state.

## Methods

- `new RunControl({ isBridgeAborted, shouldAbort })`.
- `isAborted()` (bound): this run's stop, the bridge-wide stop, or the
  caller's `shouldAbort()`.
- `completionControl`: `{ isAborted, onHandle(handle) }` for the router; a
  handle arriving after a Stop is aborted at once.
- `stop()`: marks aborted and aborts the live stream. `clearLive()`.

## Why

Stop must reach the live completion socket, or a runaway model generates to the
context wall; per-run state means two turns on one bridge do not share a Stop.
