# MessagesRequestTranslator

`core/llm-server/server/anthropic/MessagesRequestTranslator.js`

Translates one Anthropic Messages request into the chat-completions body
llama-server reads. Pure, no I/O.

## Methods

- `MessagesRequestTranslator.translate(body, modelId)` returns `{ body }`, or
  `{ error: 'messages is required' }` when `messages` is missing or empty. The body:
  - `model` is `modelId`; a non-empty system field becomes the first `system`
    message ([AnthropicContent](AnthropicContent.md)`.systemText`);
  - each turn goes through [MessageTurnTranslator](MessageTurnTranslator.md);
  - tools and `tool_choice` through [ToolDefinitionTranslator](ToolDefinitionTranslator.md);
  - `max_tokens` is floored and at least 1; numeric `temperature`, `top_p`,
    `top_k` copy across; `stop_sequences` become `stop`, capped at 4;
  - `thinking: { type: 'disabled' }` sets `enable_thinking: false`;
    `{ type: 'enabled', budget_tokens }` sets `enable_thinking: true` and a
    positive budget as `reasoning_budget`; `output_config.effort` becomes
    `reasoning_effort`;
  - `stream: true` adds `stream` and `stream_options: { include_usage: true }`
    so the final chunk carries usage.

## Why

Thinking is written in the spellings [ThinkingKnobs](../ThinkingKnobs.md)
reads, so the Messages and OpenAI routes agree on what "off" means; the router
applies ThinkingKnobs afterwards.
