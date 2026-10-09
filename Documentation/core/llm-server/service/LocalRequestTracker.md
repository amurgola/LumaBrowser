# LocalRequestTracker

`core/llm-server/service/LocalRequestTracker.js`

Counts requests against the local llama-server across every main-process client,
plus chat turns preparing one.

## Methods

- `beginPrepare()`, `endPrepare()` (never below 0): a chat turn between its
  server-state check and its POST.
- `start()`, `end()` (never below 0) move the in-flight count and notify listeners.
- `inFlight()` the count; `isBusy()` anything in flight or preparing.
- `onChange(fn)` listeners get the new count synchronously; returns an
  unsubscribe; a non-function is ignored; a throwing listener is swallowed.

## Why

The chat paths (LLM tab, sharing and web proxy turns) bypass the queue manager,
so the queue's active count is not the full picture. Compared with the running
plan's slot count it detects a request that will wait in llama-server's own
FIFO, and the preparing count keeps a vision restart from pulling the server out
from under a turn about to send.
