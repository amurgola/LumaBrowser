# OpenAiResponsesRouter

`core/llm-server/server/OpenAiResponsesRouter.js`

Route controller for the OpenAI Responses API on the localhost API (mounted by
[LocalApiServer](LocalApiServer.md) next to [OpenAiLocalRouter](OpenAiLocalRouter.md)).
Codex CLI only speaks Responses (`wire_api = "responses"`), so this is what lets
it use the loaded local model.

## Methods

- `OpenAiResponsesRouter.create(deps)` returns an Express router. `deps`:
  - `getUpstream()` (required, throws without it) returns
    `{ baseUrl, apiKey?, modelId }` for a ready server, else `null`;
  - `hostDial()` returns the host's reasoning dial, used only when the client
    said nothing about reasoning;
  - `warn(message)` (defaults to `console.warn('[local-api]', ...)`).

## Routes

- `POST /v1/responses`:
  - no ready server: 503 `server_error`, code `model_not_loaded`;
  - [ResponsesRequestTranslator](responses/ResponsesRequestTranslator.md) builds
    the chat-completions body (400 `invalid_request_error` with `param` for a
    missing `input` or any `previous_response_id`), [ThinkingKnobs](ThinkingKnobs.md)`.apply`
    maps reasoning to llama-server's knobs;
  - built-in tool types it dropped (`web_search`, `local_shell`...) are logged
    once per type per router;
  - `stream: true` runs [ResponsesStream](responses/ResponsesStream.md),
    otherwise [ResponsesCompletion](responses/ResponsesCompletion.md).

Errors use the OpenAI shape via [ResponsesError](responses/ResponsesError.md).

## Why

Codex removed its chat-completions wire API, so the Local API translates
Responses onto chat completions the same way [AnthropicMessagesRouter](AnthropicMessagesRouter.md)
does for Claude Code. It is stateless: Codex sends `store: false` and the whole
conversation each turn, so stored-response features are refused, not faked.
Dropping built-in tools instead of rejecting keeps Codex working when the user
enabled web search.
