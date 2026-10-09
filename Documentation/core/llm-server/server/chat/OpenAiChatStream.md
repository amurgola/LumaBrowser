# OpenAiChatStream

`core/llm-server/server/chat/OpenAiChatStream.js`

The state of one streaming completion from an OpenAI-compatible server. It reads
SSE lines, forwards content and reasoning deltas, gathers native tool calls,
stops runaway repetition and fires the terminal callback exactly once.

## Methods

- `new OpenAiChatStream({ onDelta, onReasoningDelta, onDone, onError }, stopRequest)`;
  `stopRequest()` cancels the HTTP request (the adapter passes its
  AbortController). Throwing callbacks are swallowed.
- `handleLines(lines)` processes complete lines (a trailing `\r` is stripped)
  and returns true when the rest of the stream must be dropped (aborted or
  stopped for repetition). Only `data:` lines count; bad JSON and choice-less
  frames are skipped, but their `usage`/`timings` are kept. `data: [DONE]`
  fires `onDone`.
- `end()` fires `onDone` unless aborted (no-op after `[DONE]`); covers servers
  that close without the sentinel.
- `fail(error)` calls `onError` unless aborted.
- `abort()` is the caller abort: stops the request, no terminal callback.
- `aborted` getter.
- `summary()` returns `{ finishReason, stopReason, usage, timings, toolCalls }`.
  `usage` is the server's usage chunk, else
  [TimingsUsage](TimingsUsage.md)`.fromTimings(timings)`; `timings` is
  forwarded as sent; `toolCalls` is `[{ id, name, args }]`.

## Repetition stops

Two [RepetitionMonitor](../../../llm-service/RepetitionMonitor.md)s watch the
answer and reasoning channels, and a
[NativeToolCallAccumulator](../../chat/NativeToolCallAccumulator.md) checks for
a repeated call whenever a fragment opens a new named slot. On a trip the stream
stops the request, sets `stopReason` to `'repetition'` (and `finishReason` too
when the server gave none) and fires `onDone`. A pure reasoning loop with no
answer text yet first emits one `onDelta` notice ("The model got stuck repeating
itself...") so the turn is not a blank bubble.

## Why once-only

llama-server sends `data: [DONE]` and then closes the stream; without the guard
the turn was finalised twice.
