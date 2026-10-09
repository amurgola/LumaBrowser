# ContextOverflow

`core/llm-server/agent/ContextOverflow.js`

Recognises a completion error meaning the request did not fit the window.

## Methods

- `ContextOverflow.isExceeded(error)`: matches "exceeds the available
  context", "context size has been exceeded", "maximum context length",
  "context window exceeded" and "context length exceeded" (case-insensitive).
  Kept narrow: a false positive evicts history for nothing.
- `ContextOverflow.parseCounts(error)`: `{ request, window }` from
  llama-server's "request (N tokens) exceeds the available context size (M
  tokens)", else null. The request count is the best calibration point there is.
