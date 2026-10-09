# AnthropicMessagesRouter

`core/llm-server/server/AnthropicMessagesRouter.js`

Route controller for the Anthropic Messages API on the localhost API (mounted by
LocalApiServer next to [OpenAiLocalRouter](OpenAiLocalRouter.md)). Claude Code,
or anything else that speaks the Messages API, only needs `ANTHROPIC_BASE_URL`
pointed at the Local API origin to run against the loaded local model.

## Methods

- `AnthropicMessagesRouter.create(deps)` returns an Express router. `deps`:
  - `getUpstream()` (required, throws without it) returns
    `{ baseUrl, apiKey?, modelId }` for a ready server, else `null`;
  - `hostDial()` returns the host's reasoning dial, used only when the client
    said nothing about thinking;
  - `warn(message)` (defaults to `console.warn('[local-api]', ...)`).

## Routes

- `POST /v1/messages/count_tokens` answers `{ input_tokens }` from
  [MessagesTokenCount](anthropic/MessagesTokenCount.md); never touches upstream.
- `POST /v1/messages`:
  - no ready server: 503 `overloaded_error` with `OpenAiLocalRouter.NO_MODEL_MESSAGE`;
  - [MessagesRequestTranslator](anthropic/MessagesRequestTranslator.md) builds
    the chat-completions body (400 `invalid_request_error` when `messages` is
    missing), [ThinkingKnobs](ThinkingKnobs.md)`.apply` maps thinking to
    llama-server's knobs;
  - `stream: true` runs [MessagesStream](anthropic/MessagesStream.md), otherwise
    [MessagesCompletion](anthropic/MessagesCompletion.md).

Errors use the Anthropic shape via [AnthropicError](anthropic/AnthropicError.md).

## Why

Nothing here starts a model, matching the OpenAI route. The loaded model always
answers whatever model id the client named, since llama-server serves one model.
