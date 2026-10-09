# AnthropicResponseMapper

`core/llm-service/providers/anthropic/AnthropicResponseMapper.js`

Translates Anthropic response facts into the OpenAI vocabulary.

## Methods

- `mapStopReason(reason)`: `end_turn`/`stop_sequence` -> `stop`,
  `max_tokens` -> `length`, `tool_use` -> `tool_calls`, others unchanged,
  missing -> `stop`.
- `usageFrom(inputUsage, outputUsage)`: `{ prompt_tokens, completion_tokens,
  total_tokens }`, plus `completion_tokens_details.reasoning_tokens` when the
  API reports thinking tokens.
- `textOf(blocks)`, `thinkingOf(blocks)`: joined text and thinking of content blocks.
- `messageWithReasoning(content, reasoning, role = 'assistant')`: a message
  carrying `reasoning_content`, or null when there is no reasoning.

## Why

`length` is the only name the agent loop treats as "the cap cut this"; the raw
`max_tokens` slipped past it and a truncated tool call was retried at the same
cap. `reasoning_content` is the field the rest of the app reads (llama-server
emits it too).
