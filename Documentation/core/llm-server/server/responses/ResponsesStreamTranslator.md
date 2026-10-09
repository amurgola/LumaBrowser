# ResponsesStreamTranslator

`core/llm-server/server/responses/ResponsesStreamTranslator.js`

Stateful translator from chat-completions stream chunks to Responses events.

## Methods

- `new ResponsesStreamTranslator({ modelId, context, emit })`; every event
  payload gets `type` and an increasing `sequence_number`.
- `chunk(chunk)` the first chunk emits `response.created` and
  `response.in_progress`; `reasoning_content` streams into a
  [StreamedReasoningItem](StreamedReasoningItem.md), `content` into a
  [StreamedMessageItem](StreamedMessageItem.md), each `tool_calls` index into
  its own [StreamedToolCallItem](StreamedToolCallItem.md). Switching kind closes
  the open item; argument fragments for an already-closed call are dropped.
  `usage` and `finish_reason` are remembered.
- `end()` closes the open item and emits `response.completed` (or
  `response.incomplete` for finish `length`) with every item and usage.
- `error(message)` emits `response.failed` with the finished items and
  [ResponsesError](ResponsesError.md)`.failure(message)`; everything after is ignored.

## Why

Codex builds its history from `response.output_item.done` and requires a
terminal `response.completed`, otherwise it retries the turn.
