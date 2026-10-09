# CarriedReasoning

`core/llm-server/agent/CarriedReasoning.js`

Sizes the reasoning a tool-call step carries forward and cuts it to its tail.
A reasoning model's chain of thought never reaches `content`, so without this
every conclusion evaporates the moment it emits a tool call.

## Methods

- `CarriedReasoning.resolveBudget(ctxPerSlot, req = null, nativeTools = false)`
  returns `{ perStep, total }` in characters. With a known window: per step
  `max(4000, 25%)` and total `ContextBudget.SHARES.carriedReasoningTotal` of the
  usable window (after the system prompt and native schemas). Unknown window:
  4000 and 16000. `req = { charsPerStep, charsTotal }` overrides, clamped to
  60% of the usable window (32000 when unknown). The total is never below one note.
- `CarriedReasoning.tail(reasoning, perStep)`: the whole text, or `…` plus its
  last `perStep` chars.
