# FitTestLive

`core/llm-server/ipc/FitTestLive.js`

The live snapshot of an in-flight fit test, read by a reloaded LLM tab.

## Methods

- `new FitTestLive(modelPath)` fields `running: true, modelPath, runtime, hardware,
  total, index, combo, results: [], chatServer` (the rest null or 0).
- `apply(msg)` mirrors a FitTester progress event: `total`, `index`, `combo`, and
  on `combo-done` the result row, replacing an earlier row for the same
  `contextTokens` and `kv`.
- `noteChatServer(payload)` remembers the last chat-server state (null when empty).
