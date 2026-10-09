# OpenAiStreamReader

`core/llm-service/providers/openai/OpenAiStreamReader.js`

Reads one OpenAI-compatible SSE stream. One instance per stream.

## Methods

- `new OpenAiStreamReader(handlers, { model, repetitionGuard = true })`.
- `read(stream)` resolves when the stream ends, `[DONE]` arrives, or a loop
  is detected (the socket is then destroyed, via [SseLineReader](../SseLineReader.md)).
- `finalizeToolCalls()` returns the [ToolCallAccumulator](ToolCallAccumulator.md)
  calls and reports each to `onToolCall`.
- Fields: `id`, `model`, `role`, `content`, `finishReason`, `usage`,
  `stopReason` (`'repetition'` or null).

## Frames

- `[DONE]` is terminal: some servers send it and hold the connection open.
- `object: 'luma.event'` frames are a Network Sharing host's side channel;
  `status` ones go to `onStatus` (the host's "loading model" progress), the
  rest are ignored on this path.
- `delta.reasoning_content` (or `delta.reasoning`) goes to `onReasoning`;
  `delta.content` (or `text`) is appended and sent to `onDelta`; tool call
  deltas to `onToolCallDelta`; `finish_reason` and `usage` are recorded.
- Malformed frames are skipped; a handler that throws loses only that frame.

## Repetition guard

Two [RepetitionMonitor](../../RepetitionMonitor.md)s watch the answer and
reasoning channels. A trip stops the stream and sets `finishReason` and
`stopReason` to `'repetition'`. A pure reasoning loop leaves no answer, so one
honest line is added (and sent to `onDelta`): every caller renders content.
`repetitionGuard: false` turns it off.
