# ThinkingDial

`core/llm-server/chat/router/ThinkingDial.js`

How hard the model should think this turn, resolved into request knobs.

## Methods

- `new ThinkingDial({ llmServerService, chatStore })`.
- `resolve({ modelRef, messages, conversationId, noThink, reasoningEffort, agentMode, evalOverrides })` returns `{ messages, plainExtra, agentExtra }`. The dial is `'off'` for `noThink === true`, else `ReasoningEffort.resolveDial({ turn, conversation: conv.reasoningEffort, fallback: defaults.noThink ? 'off' : defaults.reasoningEffort })`. Off: `ThinkingOff.resolve(modelRef, messages, getRunningThinking())`'s extra, and its directive-bearing messages only on an explicit noThink turn. Otherwise `ReasoningEffort.extraFor(dial)`. `agentExtra`: an agent turn without noThink whose extra is null gets `ReasoningEffort.extraFor(evalOverrides.agentEffort || AGENT_DEFAULT)`. Any failure is no knobs.

## Why

Voice mode's per-turn boolean is the strongest statement (dead air kills a spoken conversation); the legacy global boolean is the weakest layer. An agent turn left to the template's default reasons at xhigh on every tool pick (76 s an iteration on Qwen3.8).
