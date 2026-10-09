# AnthropicStreamReader

`core/llm-service/providers/anthropic/AnthropicStreamReader.js`

Reads one Messages API SSE stream. One instance per stream.

## Methods

- `new AnthropicStreamReader(handlers, model)`.
- `read(stream)` resolves when the stream ends (via [SseLineReader](../SseLineReader.md)).
- Fields after reading: `id`, `model`, `content`, `reasoning`,
  `finishReason`, `usage`, `error` (set by an `error` frame).

## Frames

Only `data:` lines are read; the `event:` header repeats the frame's own
`type`. `message_start` sets id, model and input usage; `content_block_delta`
appends `text_delta` (to `onDelta`) or `thinking_delta` (to `onReasoning`);
`message_delta` sets the finish reason and output usage (to `onUsage`);
`error` records `"<type>: <message>"`. Malformed frames are skipped, and a
handler that throws loses only that frame.
