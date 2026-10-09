# CapturedBridgeRun

`core/llm-server/chat/schedulers/CapturedBridgeRun.js`

Drives one [AgentChatBridge](../AgentChatBridge.md) run to its end for a
background runner: captures the final text and the tool trace and enforces a
hard timeout, so the run always settles exactly once.

## Methods

- `new CapturedBridgeRun({ timeoutMs, onToolEvent? })`. `onToolEvent(ev)` gets
  the bridge's tool events until the run settles.
- `run(bridge, options)`: calls `bridge.run({ ...options, hooks })` and
  resolves `{ finalResponse, toolTrace, error }`; never rejects. Settles on
  `onDone`, `onError`, the handle's `done` settling (a run that rejects without
  a terminal hook), a throwing `run()`, or the timeout (which aborts the handle
  and reports `run timed out after N minutes`).
- `pauseTimeout()` / `resumeTimeout()`: stop and re-arm the clock with the time
  left (at least 1 s), for a run parked on a human approval.
- `settled` (getter).

Hooks wired: `onDelta` appends, `onContentRollback(n)` removes the last `n`
characters, `onToolTrace({ tools })` keeps the latest list.
