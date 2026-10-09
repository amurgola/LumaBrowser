# ChatStream

`core/network-sharing/webapp/public/js/transport/ChatStream.js`

One streamed chat completion against `POST /sharing/llm/v1/chat/completions`
(OpenAI-compatible SSE plus the `luma.event` side channel).

## Methods

- `new ChatStream(http, { cryptoImpl = crypto })`.
- `run({ model, messages, temperature, agent, agentId, attachments, priorArtifacts, reasoningEffort, signal, onDelta, onReasoning, onEvent })`
  resolves `{ content, usage }`. The body carries `stream: true`, `agent: !!agent`,
  and omits `agentId`, `attachments`, `priorArtifacts` and `reasoning_effort` when
  empty (an omitted dial lets the host's own default apply). Side-channel frames
  call `onEvent(event, payload)`; a `rollback` first takes `payload.chars`
  characters back off the answer. `data: [DONE]` ends the read. A 401 throws
  Unauthorized; another error throws the host's `error.message` or
  `Chat request failed`.
- `newTurnId()`: `turn_<uuid>`, or `turn_<time>_<random>` without `randomUUID`.

## Stop

Every turn sends `X-Luma-Turn-Id`. When the signal aborts (or is already
aborted) it also posts `{ id }` to `/sharing/llm/v1/chat/abort` with the bearer
and `keepalive: true`: through a reverse proxy the socket close often never
reaches the host, and a runaway model would generate on.

## Behaviour change

A `rollback` of 0 characters now keeps the answer. Legacy computed
`content.slice(0, -0)`, which is `''`, and wiped it (test in LumaApi.test.js).
