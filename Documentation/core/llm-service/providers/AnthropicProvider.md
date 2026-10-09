# AnthropicProvider

`core/llm-service/providers/AnthropicProvider.js`

LLM provider for the Anthropic Messages API. Extends
[BaseLlmProvider](BaseLlmProvider.md) and runs its contract test. Answers in
the OpenAI `chat.completion` shape like every provider.

## Methods

- `new AnthropicProvider(db)`: settings under `anthropic.*`, default endpoint
  `https://api.anthropic.com`.
- `capabilities`: no tools (no `tool_use` blocks are emitted or parsed), cache
  prefix and reasoning stream supported, `defaultMaxTokens` 32000 (the floor).
- `testConnection()`, `fetchModels()`: both refuse without an endpoint or an
  API key (the API has no anonymous read). Models are stored as
  `{ id, object, created, owned_by: 'anthropic' }`.
- `sendChatCompletion(messages, options)`: 30 s default timeout.
- `createChatCompletionStreamSession(messages, options, handlers)`: 120 s
  default; handlers `onDelta(text, frame)`, `onReasoning(text, frame)`,
  `onUsage(usage)`, `onError(message)`. Resolves through `_streamSession`, so
  `done` never rejects.

Both refuse with `No endpoint configured` / `No model selected` first.

## Behaviour

- `max_tokens` is required by the API, so one is always sent: the caller's
  positive value clamped to the model's ceiling, else the ceiling (bug H5: a
  silent 4096 used to truncate every remote turn). See
  [AnthropicModelLimits](anthropic/AnthropicModelLimits.md).
- A 400 "max_tokens: N > M" rejection is learned for that model and the
  request is resent once at M.
- Thinking streams as reasoning and returns as `reasoning_content`; stop
  reasons map to OpenAI names (`max_tokens` -> `length`). See
  [AnthropicRequestBody](anthropic/AnthropicRequestBody.md) and
  [AnthropicResponseMapper](anthropic/AnthropicResponseMapper.md).
- A mid-stream `error` frame fails the turn (`"<type>: <message>"`) instead of
  returning the partial answer as success
  ([AnthropicStreamReader](anthropic/AnthropicStreamReader.md)).
- A rejected streaming request's error body is read so the API's message
  reaches the user ([StreamedErrorBody](StreamedErrorBody.md)).
