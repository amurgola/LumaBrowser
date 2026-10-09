# ResponseEnvelope

`core/llm-server/server/responses/ResponseEnvelope.js`

The Responses `response` object for one request.

## Methods

- `new ResponseEnvelope({ id, modelId, echo, createdAt })`.
- `inProgress()` status `in_progress`, empty output, null usage.
- `finished({ output, usage, finishReason })` `completed`, or `incomplete` with
  `incomplete_details.reason = 'max_output_tokens'` for finish `length`.
- `failed({ output, error })` status `failed` with `error: { code, message }`.
- `echo(body)` (static) `instructions`, `tools`, `tool_choice`,
  `parallel_tool_calls`, `store` with defaults, plus `reasoning`, `temperature`,
  `top_p`, `max_output_tokens`, `text`, `metadata` when sent.
- `usage(chatUsage)` (static) `input_tokens`, `input_tokens_details.cached_tokens`,
  `output_tokens`, `output_tokens_details.reasoning_tokens`, `total_tokens`.

## Why

Every state carries the same id, timestamp and echoed settings; Codex reads
`id` and `usage` from `response.completed`.
