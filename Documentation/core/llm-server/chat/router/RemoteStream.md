# RemoteStream

`core/llm-server/chat/router/RemoteStream.js`

Streams one chat request to a remote provider config through an ephemeral provider that never writes the user's settings.

## Methods

- `new RemoteStream({ db })`.
- `stream(config, modelId, messages, temperature, hooks, extra = null, tools = null)` returns `{ abort }`. Builds the provider from `PROVIDERS` (`openai` -> OpenAICompatibleProvider, `anthropic` -> AnthropicProvider) over `NonPersistingDb.wrap(db)`; throws `Provider type "x" is not supported from the LLM tab yet.` otherwise. Options: `temperature`, `model`, `chatTemplateKwargs`, a numeric `reasoningBudget`, for a `peerManaged` config a `sessionId` `turn_<16 hex>`, and `max_tokens` from `extra.maxReplyTokens` (the user's Tune cap) when numeric; `extra.maxTokens` is never sent. A non-empty `tools` array (the agent loop's OpenAI function schemas) rides as `options.tools`. Frames map to `onDelta`, `onReasoningDelta`, `onToolCallDelta`, `onStatus`, `onUsage`, `onError`; the settled session becomes `onDone({ finishReason, toolCalls? })` (the choice's finish reason, and the provider's native calls as `[{ id, name, args }]`, the local adapter's shape, when it made any), `onError`, or nothing for our own abort.
- `abort()` closes the session and, for a peer, posts `{ id }` to `PEER_ABORT_PATH` (`/v1/chat/abort`, 5 s, fire-and-forget).

## Why

The provider singletons persist endpoint and key on every setter, so a turn must not use them. A remote ref counts as a native-tool model ([ModelCapabilities](ModelCapabilities.md)), so the schemas have to reach the provider and its calls have to come back in the summary, or the model would be left with neither the array nor the fence guidance. The bridge's reply cap is sized from the LOCAL window and would cripple a remote model; a cap the user set on the model or profile is deliberate, so it is sent. A peer host behind a keep-alive agent or proxy may never see our socket close, so Stop also names the turn.
