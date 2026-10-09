# OpenAiLocalRouter

`core/llm-server/server/OpenAiLocalRouter.js`

Route controller for the localhost OpenAI-compatible API (mounted by
LocalApiServer at `127.0.0.1:<port>`, no auth). It proxies straight to the
running llama-server, so everything llama-server understands (tool calls,
`response_format`, logprobs, `/v1/completions`) passes through untouched.

## Methods

- `OpenAiLocalRouter.create(deps)` returns an Express router. `deps`:
  - `getUpstream()` (required) returns `{ baseUrl, apiKey?, modelId, thinking? }`
    for a ready server, else `null`;
  - `listModels()` resolves to `[{ id, current? }]` for `/v1/models`;
  - `hostDial()` returns the host's reasoning dial, used only for silent clients;
  - `getThinking()` returns probe facts for the loaded model (falls back to
    `upstream.thinking`);
  - `warn(message)` (defaults to `console.warn('[local-api]', ...)`).
- `OpenAiLocalRouter.NO_MODEL_MESSAGE` is
  `No chat model is loaded. Open the LLM tab and start one.`

## Routes

- `GET /` and `GET /health` report whether a model is loaded (`/health` is 503 when not).
- `GET /v1/models`, `GET /v1/models/:id` via [OpenAiModelList](OpenAiModelList.md);
  a failing `listModels` is logged and treated as empty.
- `POST /v1/chat/completions` requires a non-empty `messages` (400 otherwise),
  applies [ThinkingKnobs](ThinkingKnobs.md), and answers 400
  `thinking_cannot_be_disabled` when the template cannot honour Off.
- `POST /v1/completions`, `POST /v1/embeddings` forward as is.
- Every POST answers 503 `model_not_loaded` when no server is ready, sets
  `model` to the loaded id (one model is served whatever the client named) and
  hands off to [UpstreamProxy](UpstreamProxy.md).

## Why

Nothing here starts a model: while no server is ready every inference route
answers 503 at once, so an editor plugin fails fast instead of hanging on a spawn.
