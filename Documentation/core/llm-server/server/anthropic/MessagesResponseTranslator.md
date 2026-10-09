# MessagesResponseTranslator

`core/llm-server/server/anthropic/MessagesResponseTranslator.js`

Translates a non-streaming chat-completions response into an Anthropic
Messages response. Pure.

## Methods

- `MessagesResponseTranslator.translate(completion, modelId)` returns
  `{ id, type: 'message', role: 'assistant', model, content, stop_reason, stop_sequence: null, usage }`:
  content is a `thinking` block (empty `signature`) for `reasoning_content`,
  a `text` block, then `tool_use` blocks; an empty reply gets one empty text
  block. `id` via [AnthropicIds](AnthropicIds.md), `stop_reason` via
  [StopReason](StopReason.md)`.forReply`.
- `MessagesResponseTranslator.toolUseBlocks(toolCalls)` returns `tool_use`
  blocks; string arguments are parsed (blank -> `{}`, unparseable ->
  `{ _raw: arguments }`), object arguments pass through, missing ids are minted.
- `MessagesResponseTranslator.usage(usage)` maps `prompt_tokens`/`completion_tokens`
  to `{ input_tokens, output_tokens }`, zeros when absent. Shared with the
  stream translator.
