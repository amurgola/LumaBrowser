# TakeoverWait

`core/llm-server/chat/bridge/waits/TakeoverWait.js`

The wait on an ask_user_takeover card. A [HumanWait](HumanWait.md).

## Methods

- `wait()` resolves the tool result: `continue` -> `{ success: true, message:
  CONTINUE }` (re-check the page), `skip` -> `SKIP`, `stop` -> `{ success:
  false, error: 'stopped' }`, timeout (`TIMEOUT_MS`, 4 minutes) -> `TIMED_OUT`.
  A second wait settles the first as `skip`.
- `respond(action)`: `skip`, `stop`, anything else `continue`.
