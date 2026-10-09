# RollbackBuffer

`cli/lib/RollbackBuffer.js`

Holds back streamed text that might turn out to be a tool call.

## Methods

- `new RollbackBuffer(write)`; field `pending`.
- `push(text)`: writes everything before the last possible tool opener (`HOLD_MARKERS`: a code fence,
  `<tool_call`, `<function`) and holds the rest; with no opener, writes everything.
- `rollback(chars)`: drops up to `chars` from the end of the held text.
- `flush()`: writes what is held. `reset()`: forgets it.

## Why

The bridge streams a model's tokens as they arrive and later retracts the ones that were a tool call
(`rollback { chars }`). A terminal cannot un-print, so suspect text waits until it resolves. Used by
[PlainRenderer](plain/PlainRenderer.md) and the full-screen [App](tui/session/App.md) (which also
trims already-shown answer text when a rollback reaches past the held part).
