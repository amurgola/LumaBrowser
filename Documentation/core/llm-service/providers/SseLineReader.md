# SseLineReader

`core/llm-service/providers/SseLineReader.js`

Splits a streamed HTTP body into lines for an SSE frame processor. Shared by
both providers' stream readers.

## Methods

- `SseLineReader.read(stream, onLines)` returns a promise. `onLines(lines)`
  gets complete lines (split on `\r?\n`, partial lines buffered across
  chunks) and returns true to stop. Stopping settles the promise, ignores
  later data and destroys the stream. On `end` the unterminated last line is
  flushed. A stream error rejects.

## Why

Bug L6: the hand-rolled framers disagreed at the edges. A final frame without
a trailing newline (where `usage` and `finish_reason` usually ride) was
dropped, and `[DONE]` was not terminal on every path, so a server that held the
socket open stalled the turn until the read timeout. Destroying the socket is
what actually stops a server that keeps generating.
