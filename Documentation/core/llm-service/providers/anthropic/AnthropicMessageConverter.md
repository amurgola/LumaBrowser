# AnthropicMessageConverter

`core/llm-service/providers/anthropic/AnthropicMessageConverter.js`

Converts OpenAI-style messages to the Messages API shape.

## Methods

- `convert(messages)` returns `{ system, messages }`. System messages are
  joined with blank lines (non-string content as JSON). Every other message
  becomes `user` unless it is `assistant`. Content parts: `text` stays text,
  a `data:image/...;base64,` `image_url` becomes a base64 image block, any
  other part becomes a text block holding its JSON.
