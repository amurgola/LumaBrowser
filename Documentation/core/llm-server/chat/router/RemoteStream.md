# RemoteStream

`core/llm-server/chat/router/RemoteStream.js`

Streams one chat request to a remote provider config through an ephemeral provider that never writes the user's settings.

## Methods

- `new RemoteStream({ db })`.
- `stream(config, modelId, messages, temperature, hooks, extra = null, tools = null)` returns `{ abort }`. Builds the provider from `PROVIDERS` (`openai` -> OpenAICompatibleProvider, `anthropic` -> AnthropicProvider) over `NonPersistingDb.wrap(db)`; throws `Provider type "x" is not supported from the LLM tab yet.` otherwise. Options: `temperature`, `model`, `chatTemplateKwargs`, a numeric `reasoningBudget`, for a `peerManaged` config a `sessionId` `turn_<16 hex>`, and `max_tokens` from `extra.maxReplyTokens` (the user's Tune cap) when numeric; `extra.maxTokens` is never sent. A non-empty `tools` array (the agent loop's OpenAI function schemas) rides as `options.tools`. Frames map to `onDelta`, `onReasoningDelta`, `onToolCallDelta`, `onStatus`, `onUsage`, `onError`; the settled session becomes `onDone({ finishReason, toolCalls? })` (the choice's finish reason, and the provider's native calls as `[{ id, name, args }]`, the local adapter's shape, when it made any), `onError`, or nothing for our own abort.
- `abort()` closes the session and, for a peer, posts `{ id }` to `PEER_ABORT_PATH` (`/v1/chat/abort`, 5 s, fire-and-forget).

## Why

The provider singletons persist endpoint and key on every setter, so a turn must not use them. A remote ref counts as a native-tool model ([ModelCapabilities](ModelCapabilities.md)), so the schemas have to reach the provider and its calls have to come back in the summary, or the model would be left with neither the array nor the fence guidance. The bridge's reply cap is sized from the LOCAL window and would cripple a remote model; a cap the user set on the model or profile is deliberate, so it is sent. A peer host behind a keep-alive agent or proxy may never see our socket close, so Stop also names the turn.

## Changes (2026-11-09, helper model)

`extra.responseFormat` rides as `response_format` in the provider options (forwarded into the body); servers that do not know the field reject or ignore it.

## Changes (2026-11-14, a paired host gets the whole request)

- `max_tokens` is the smaller of `extra.maxReplyTokens` and a chat mode's own reply cap (`extra.samplerOverrides.max_tokens`), for every remote (`_replyCap`). The mode's cap is sized from the reply it asked for, not from a window, so the reason the bridge's `maxTokens` stays home does not apply to it.
- For a `peerManaged` config (`_peerOptions`): the mode's other samplers ride as `options.samplerOverrides` (the provider writes them into the body: DRY, min-p, `reasoning_budget_tokens`), and `extra.pinTemperature` rides as the body field `luma_pin_temperature` (`PEER_PIN_TEMPERATURE`). The host reads both with [ClientRequestKnobs](../../../network-sharing/host/llm/ClientRequestKnobs.md). Other endpoints get neither: they may reject fields they do not know.
- The thinking knobs reach the wire as `chat_template_kwargs` and `reasoning_budget` ([OpenAiRequestBody](../../../llm-service/providers/openai/OpenAiRequestBody.md)); they used to arrive as `chatTemplateKwargs` and `reasoningBudget`, which a host does not read.

Why: a roleplay played from a paired client ran on the host with no reply cap (`n_predict -1`, so a reply that came apart generated until the host's context was full), without the mode's samplers or thinking budget, with every bookkeeping call at the model family's temperature instead of its own 0.2, and with "thinking off" ignored (the host's dial filled the silence). Measured with `npm run rp:text -- --via-host` ([TextRunCli](../../../../tools/roleplay/TextRunCli.md)).

## The rule for a paired host's model (2026-11-14)

The host's configuration decides how its model runs: its context window, its model family's sampler, its Tune settings for the model, its thinking dial. A paired client sends only what something on its side specifically chose for that request, and each of those is listed here so the list stays short on purpose:

| Sent by the client | When | What the host does with it |
| --- | --- | --- |
| thinking position (`chat_template_kwargs`, `reasoning_budget`) | the turn, the chat's pill, the model's Tune setting or a mode asked for one; a side call marked no-think | wins over the host's dial (the host's dial only fills silence) |
| `max_tokens` | a chat mode's reply cap, or the user's Tune cap for that model | the smaller of it and the host's own Tune cap |
| sampler numbers (DRY, min-p, `reasoning_budget_tokens`) | a chat mode asked for them (the roleplay narrator) | applied; the host's own Tune sampler for the model wins where both name a knob |
| `luma_pin_temperature` with the temperature | a side call that needs its own temperature (a bookkeeping call at 0.2) | that temperature is kept over the host's family sampler and Tune temperature |
| `response_format` | a side call's JSON schema | decoded under the grammar |

Never sent: this side's Setup defaults for its own local server (context size, the default thinking position, launch settings). An ordinary turn's temperature is sent as always, and the host's family sampler or Tune temperature replaces it.

Also part of the rule (same day): the system prompt is the client's alone. A LumaBrowser client's turn takes the host's plain path, which dispatches the messages exactly as sent (14 of 14 narrator turns byte-identical on both sides of a recorded run, one system message each; `LabSharingHost.test.js`). The host only writes a prompt of its own for a turn that asks for its agent (`agent: true`, what the served web page sends, or a shared host agent's `agentId`), where there is no client prompt to double. Tool calls from a client's own agent loop use the text fence on a paired host ([ModelCapabilities](ModelCapabilities.md)).
