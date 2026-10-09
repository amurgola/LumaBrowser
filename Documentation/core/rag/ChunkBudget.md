# ChunkBudget

`core/rag/ChunkBudget.js`

The size rules of one chunking run, resolved from [TextChunker](TextChunker.md)
options into characters through
[TokenEstimator](../shared/text/TokenEstimator.md) (4 characters per token).

## Members

- `new ChunkBudget({ maxTokens, overlapTokens, headingContext })`.
  `maxTokens` falsy means the default. `overlapTokens` null/undefined means the
  default; `0` turns the carry off. `headingContext` is on unless `false`.
- `maxChars`, `carryChars`, `sectionFloorChars`, `headingContext`.
- `fits(length)`: whether a span of that length fits a chunk.

## Constants and why

- `BUDGET_TOKENS = 384`: the span budget per chunk. Retrieval studies put the
  useful range at roughly 256-512 tokens (smaller for factoid lookups, larger
  for explanatory text), and the small embedders a local app would plug into
  [RagEmbedder](RagEmbedder.md) (bge, e5) truncate at 512 tokens. 384 is 3/4 of
  that window, leaving room for the estimator's error on code and non-English
  text and for the heading line, which is not counted in the budget.
- `CARRY_TOKENS = 48`: the ceiling for context carried into the next chunk,
  about two average English sentences and 1/8 of the budget, inside the
  commonly cited 10-20% overlap. Only whole sentences are carried, so the
  actual carry is often smaller and sometimes none.
- `SECTION_FLOOR_RATIO = 0.25`: a heading closes the open chunk only once it
  holds a quarter of the budget (96 tokens, a short paragraph). Below that, a
  short section joins the next one instead of becoming a thin chunk that ranks
  poorly and wastes a retrieval slot.
