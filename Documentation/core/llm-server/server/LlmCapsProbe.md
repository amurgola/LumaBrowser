# LlmCapsProbe

`core/llm-server/server/LlmCapsProbe.js`

Asks a serving llama-server what its loaded model can do. Today one capability:
how the chat template controls reasoning.

## Methods

- `new LlmCapsProbe({ baseUrl, authKey, modelPath, recallProbe, logTag })`.
- `execute()` resolves `{ reasoningEffort, reasoningDial, thinking }` and never rejects:
  1. `GET /props` (3 s, bearer when `authKey` is set) for `chat_template` or
     `default_generation_settings.chat_template`;
  2. `recallProbe(modelPath, ThinkingProbe.templateHashOf(template))` reuses
     cached facts; otherwise [ThinkingProbe](ThinkingProbe.md)`.probe` renders
     through `POST /apply-template` (bearer, any status accepted) and logs a
     one-line summary;
  3. `reasoningEffort` is `ThinkingFacts.offersControl(facts)` for probed facts,
     else the old `/reasoning_effort/` regex on the template;
     `reasoningDial` is `ReasoningEffort.dialPositionsFor(facts)`.
  Any failure leaves `emptyCaps()`.
- `LlmCapsProbe.emptyCaps()` `{ reasoningEffort: null, reasoningDial: DIAL_POSITIONS, thinking: null }`.
- `LlmCapsProbe.PROPS_TIMEOUT_MS` (3000).

## Why

How a template controls reasoning is not a property of the architecture or the
file name: two GGUFs of one model can carry different templates. Rendering it is
the only reliable answer. `null` means "unknown", not "unsupported"; consumers
hide the control either way, but a later retry can tell the two apart. `/props`
sits behind `--api-key` while `/health` does not, so an unauthenticated probe
would silently never offer the dial.
