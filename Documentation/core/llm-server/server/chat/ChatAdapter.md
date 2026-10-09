# ChatAdapter

`core/llm-server/server/chat/ChatAdapter.js`

Base class for the boundary between the runtime supervisor and an inference
server's wire protocol. Concrete adapters (OpenAICompatAdapter today) subclass it.

## Members

- `constructor({ baseUrl, apiKey?, model?, request? })` throws when called on
  `ChatAdapter` itself or without `baseUrl`. Sets:
  - `baseUrl` with trailing slashes stripped
  - `apiKey` (non-empty string or `null`)
  - `model`, the public model id to send in request bodies (non-empty string or
    `null`, meaning omit the field)
  - `request`, the catalog entry's request-translation profile (object or `null`)
- `authHeaders()` returns `{ Authorization: 'Bearer <key>' }` when `apiKey` is
  set, otherwise `{}`. Subclasses spread it into their own headers.
- `healthCheck()` async; resolves true when the server is reachable and has
  finished loading a model. Rejects until implemented.
- `chat({ messages, temperature?, maxTokens?, onDelta, onReasoningDelta?, onDone, onError })`
  starts a streaming completion and returns `{ abort() }`. `onReasoningDelta`
  receives a separate reasoning stream (`delta.reasoning_content`) when the
  server has one; adapters without that channel never call it and the UI falls
  back to inline `<think>` parsing. `onDone` receives `{ finishReason?, usage? }`.
  Throws until implemented.
- `static get protocolId()` names the protocol for logging; `'abstract'` on the base.

## Why an abstraction

Every runtime in today's catalog speaks the OpenAI-compatible protocol because
they are all llama.cpp variants, but Ollama (`/api/chat`, NDJSON), vLLM quirks or
a custom server are a catalog entry away. Keeping the boundary means adding one
means dropping in a new subclass. `apiKey` matches the `--api-key` the local
llama-server was launched with, so the chat hot path uses the supervisor's auth.
`model` exists because servers such as NInfer reject requests whose model id does
not match their artifact identity.

ImageAdapter in the image server is a sibling with the same shape; both are
candidates for one shared adapter base later.
