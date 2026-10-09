# ReadBudget

`extensions/game-mode/tools/project/ReadBudget.js`

Sizes file reads to the running model's per-slot context window.

## Methods

- `compute(service = global.__lumaLlmServerService)` -> `{ truncator, wholeFileMaxBytes, ctxPerSlot? }` from `getEffectiveContext()` (the running plan), else `getDefaults()` (`contextSize / maxConcurrent`), else a default truncator and a 32 KB whole-file cap. A whole read may claim 80% of the slot at ~4 bytes per token. Logs its choice once.
- `wholeReadChars(ctxPerSlot, chunkMaxBytes)` how many result chars a whole-read claim survives: `ContextBudget.resolveBudget().toolHistoryChars`, floored at one bounded result.
