# StopReason

`core/llm-server/server/anthropic/StopReason.js`

Maps an OpenAI `finish_reason` to the Anthropic `stop_reason`.

## Methods

- `StopReason.forFinish(finishReason)`: `tool_calls`/`function_call` ->
  `tool_use`, `length` -> `max_tokens`, anything else (including null) -> `end_turn`.
- `StopReason.forReply(finishReason, hasToolCalls)`: `tool_use` when the reply
  carried tool calls and was not cut off by `length`, else `forFinish`.

## Why

llama-server can finish with `stop` after emitting tool calls; the client
still has tools to run, so the reply must say `tool_use`. A `length` cut-off
wins because the tool arguments may be incomplete.
