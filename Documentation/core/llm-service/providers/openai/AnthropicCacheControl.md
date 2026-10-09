# AnthropicCacheControl

`core/llm-service/providers/openai/AnthropicCacheControl.js`

## Methods

- `AnthropicCacheControl.apply(messages)` returns shallow copies with an
  `{ type: 'ephemeral' }` `cache_control` marker on the system prompt and on
  the last user or assistant message. String content becomes one text part
  (empty strings are left alone); for part arrays the last text part is
  marked. Input is never mutated.

## Why

OpenAI-compatible proxies in front of Anthropic (OpenRouter, LiteLLM) honour
these markers to cache the prompt prefix across turns. Other servers pass the
field through or ignore it.
