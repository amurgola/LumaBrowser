# MessagesStreamTranslator

`core/llm-server/server/anthropic/MessagesStreamTranslator.js`

Stateful translator from parsed chat-completions stream chunks to Anthropic
Messages events.

## Methods

- `new MessagesStreamTranslator({ modelId, emit })`; `emit(eventType, payload)`
  receives every event.
- `chunk(chunk)` translates one parsed chunk. The first call emits
  `message_start` (id from the chunk via [AnthropicIds](AnthropicIds.md)) and
  `ping`. `reasoning_content` deltas go to a `thinking` block, `content` deltas
  to a `text` block, `tool_calls` deltas open one `tool_use` block per upstream
  tool index and stream their argument fragments as `input_json_delta`.
  Switching kind closes the open block (`content_block_stop`). Usage and
  `finish_reason` are remembered.
- `end()` closes the open block and emits `message_delta` (stop reason via
  [StopReason](StopReason.md)`.forReply`, usage) and `message_stop`. An empty
  upstream still gives a well-formed message. Idempotent.
- `error(message)` emits one `error` event (`api_error`); everything after it
  is ignored.

## Why

Anthropic clients expect strict block framing: one open block at a time, each
with start/delta/stop. Argument fragments for a tool whose block was already
closed (interleaved parallel calls) are dropped rather than written into the
wrong block, as legacy did.
