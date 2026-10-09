# ApprovalWait

`core/llm-server/chat/bridge/waits/ApprovalWait.js`

The wait on an approval card. A [HumanWait](HumanWait.md).

## Methods

- `wait(timeoutMs?)` resolves `'once'`, `'run'`, `'reject'` or `'timeout'`
  (default `TIMEOUT_MS`, 2 minutes). A second wait settles the first as `reject`.
- `respond(decision)`: `run`, `once`, anything else `reject`.

Silence denies.
