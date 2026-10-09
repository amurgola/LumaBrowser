# RemoteStream

`core/llm-server/chat/router/RemoteStream.js`

Streams one chat request to a remote provider config through an ephemeral provider that never writes the user's settings.

## Methods

- `new RemoteStream({ db })`.
- `stream(config, modelId, messages, temperature, hooks, extra = null)` returns `{ abort }`. Builds the provider from `PROVIDERS` (`openai` -> OpenAICompatibleProvider, `anthropic` -> AnthropicProvider) over `NonPersistingDb.wrap(db)`; throws `Provider type "x" is not supported from the LLM tab yet.` otherwise. Options: `temperature`, `model`, `chatTemplateKwargs`, a numeric `reasoningBudget`, and for a `peerManaged` config a `sessionId` `turn_<16 hex>`; `extra.maxTokens` is never sent. Frames map to `onDelta`, `onReasoningDelta`, `onStatus`, `onUsage`, `onError`; the settled session becomes `onDone({ finishReason: 'stop' })`, `onError`, or nothing for our own abort.
- `abort()` closes the session and, for a peer, posts `{ id }` to `PEER_ABORT_PATH` (`/v1/chat/abort`, 5 s, fire-and-forget).

## Why

The provider singletons persist endpoint and key on every setter, so a turn must not use them. The bridge's reply cap is sized from the LOCAL window and would cripple a remote model. A peer host behind a keep-alive agent or proxy may never see our socket close, so Stop also names the turn.
