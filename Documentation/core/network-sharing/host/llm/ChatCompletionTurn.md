# ChatCompletionTurn

`core/network-sharing/host/llm/ChatCompletionTurn.js`

`POST /sharing/llm/v1/chat/completions`: one OpenAI-compatible chat turn from a
shared client. A [SharedLlmTurn](SharedLlmTurn.md).

## Methods

- `new ChatCompletionTurn(service, turns, agents)`; `run(req, res)`.

## Behaviour

Validation, in order (errors are `{ error: { message } }`):
1. `agentId` set: [SharedAgents](../SharedAgents.md)`.resolveTurn` (403 not shared, 404 unknown).
2. `messages` empty or missing: 400 `messages is required`; no `model`: 400 `model is required`.
3. [LlmModelGate](LlmModelGate.md)`.denied`: 403 with its message.
4. No `proxyStream` on the chat router: 503 `host chat is not ready`; an
   agentic turn without `proxyAgent`: 503 `host agent tools are not available`.

Inputs ([ChatTurnInputs](ChatTurnInputs.md)): streams unless `stream: false`;
the agentic path runs for `agent: true` / `tools: true`, or as the agent's
grant decides; images from `attachments`; `priorArtifacts` passed through;
thinking `extra` from `ThinkingKnobs.extra(body, service.hostDialPosition())`.
An agent's pinned `modelRef` replaces the client's model for the proxy call
(the wire `model` stays the client's).

Dispatch: `proxyStream({ modelRef, messages, temperature, hooks, images,
extra })` (persona prepended for a tool-less agent), or `proxyAgent({ ...,
priorArtifacts, allowedTools, modeSystemPrompt, kbScope })` with the agent
grant narrowed by the host allow-list.

Hooks: content and `reasoning_content` deltas as chunks; `status`, `tool`,
`artifact` (counted for usage), `artifact-stream`, typed agent events under
their own name and the typeless sub-agent stream as `agent`, and `rollback`
(`{ chars }`, trimming the non-stream content) as `luma.event` frames.

Endings ([ChatCompletionStream](ChatCompletionStream.md)): done writes the
usage chunk, the finish chunk (`summary.finishReason` or `stop`) and `[DONE]`,
or the `chat.completion` JSON; cancel and mid-stream error finish with `stop`
and `[DONE]`; a cancelled non-stream turn answers the partial content.

## Changes (2026-11-09, response_format)

A client's `response_format` object rides the proxy extra as `responseFormat` (`_withResponseFormat`), so a shared clerk decodes a mode's schema under the grammar as a local side call does.

## Changes (2026-11-14, the client's sampling and length fields)

The proxy extra also takes what [ClientRequestKnobs](ClientRequestKnobs.md) reads from the body: `max_tokens` (or `max_completion_tokens`) as `maxTokens`, the llama-server sampler numbers as `samplerOverrides`, and `luma_pin_temperature: true` as `pinTemperature`. The host's local path then applies them as it does for its own turns (the smaller of the client's cap and the host's Tune cap; the host's own model sampler still wins over the client's where both name a knob). Before this the handler read only the temperature and the thinking knobs.

## Changes (2026-11-14, the agent default)

`_agentDefault(extra, body)`: when the client marked the turn as its own agent loop (`luma_agent_turn`) and neither the client nor this host's dial produced a thinking position, the agent default applies (`ReasoningEffort.AGENT_DEFAULT`), exactly as on this host's own agent turn. A position from either side wins.
