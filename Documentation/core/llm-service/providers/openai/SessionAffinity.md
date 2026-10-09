# SessionAffinity

`core/llm-service/providers/openai/SessionAffinity.js`

## Methods

- `SessionAffinity.headers(sessionId)`: `{ session_id, 'x-session-affinity',
  'x-client-request-id' }` all set to the id, or `{}` without one.

Caching proxies and inference routers (LiteLLM, sticky llama.cpp clusters,
vLLM fleets) use these to keep a conversation on one backend; other servers
ignore them, so they are always safe to send.
