# ThinkingDial

`core/llm-server/chat/router/ThinkingDial.js`

How hard the model should think this turn, resolved into request knobs.

## Methods

- `new ThinkingDial({ llmServerService, chatStore })`.
- `resolve({ modelRef, messages, conversationId, noThink, reasoningEffort, agentMode, evalOverrides, modelEffort })` returns `{ messages, plainExtra, agentExtra }`. The dial is `'off'` for `noThink === true`, else `ReasoningEffort.resolveDial({ turn, conversation: conv.reasoningEffort, model: modelEffort, fallback: defaults.noThink ? 'off' : defaults.reasoningEffort })`; `modelEffort` is the picked model's or profile's Tune setting ([ModelSettings](../../service/ModelSettings.md)), absent when it inherits. Off: `ThinkingOff.resolve(modelRef, messages, getRunningThinking())`'s extra, and its directive-bearing messages only on an explicit noThink turn. Otherwise `ReasoningEffort.extraFor(dial)`. `agentExtra`: an agent turn without noThink whose extra is null gets `ReasoningEffort.extraFor(evalOverrides.agentEffort || AGENT_DEFAULT)`. Any failure is no knobs.

## Why

The model layer sits below the conversation pill (a per-chat choice) and above the global default, so a profile like "Fast" can turn thinking off without touching the global setting. Voice mode's per-turn boolean is the strongest statement (dead air kills a spoken conversation); the legacy global boolean is the weakest layer. An agent turn left to the template's default reasons at xhigh on every tool pick (76 s an iteration on Qwen3.8).

## Changes (2026-11-14, a paired host decides in silence)

`new ThinkingDial({ llmServerService, chatStore, peers })`: `peers` is a [PeerModelRef](PeerModelRef.md) (null: no model is ever a paired host's). For a paired host's model the fallback layer (this side's Setup default, the legacy "Disable thinking" switch) is left out of `resolveDial`, so with nothing chosen on the turn, the chat's pill or the model's Tune setting, no knob is sent and the host's own dial applies. The Setup default is a setting for this side's local server, not a choice about the host's model; sent along it read on the host as a stated preference and replaced the host's dial. It never used to arrive (the knobs went out misnamed until the same day's fix in [OpenAiRequestBody](../../../llm-service/providers/openai/OpenAiRequestBody.md)), which is why this only became visible then. Other remote providers and the local server keep the Setup default. The whole rule is in [RemoteStream](RemoteStream.md).

## Changes (2026-11-14, the agent default on a paired host)

`_agentExtra` is an instance method. For a paired host's model, an agent turn with nothing chosen returns `{ agentTurn: true }` instead of the agent default's knobs: the host knows its own dial and this side does not, so the host fills the default in ([ChatCompletionTurn](../../../network-sharing/host/llm/ChatCompletionTurn.md) `_agentDefault`). An eval's `agentEffort` is a choice and is still sent. Sent from here, the agent default (Low) replaced a host dial set to anything else.
