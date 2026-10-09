# AnthropicError

`core/llm-server/server/anthropic/AnthropicError.js`

Answers a request with an error in the Anthropic Messages shape.

## Methods

- `AnthropicError.send(res, status, type, message)` sets the status and sends
  `AnthropicError.body(type, message)`.
- `AnthropicError.body(type, message)` returns `{ type: 'error', error: { type, message } }`.
