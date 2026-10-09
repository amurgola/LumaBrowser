# ConvexScoreFusion

`core/rag/ConvexScoreFusion.js`

Blends lexical and dense relevance into one score.

## Methods

- `ConvexScoreFusion.blend(lexical, dense, denseWeight = 0.6)` takes two
  `Map id -> 0..1` and returns `[{ id, relevance }]` best first, with
  `relevance = (1 - w) * lexical + w * dense` and 0 for a side that lacks the
  id. With no dense evidence `w` is 0, so lexical relevance stands unweighted.
  Ties keep lexical-then-dense order.
- `ConvexScoreFusion.DENSE_WEIGHT` (0.6).

## Why

A convex combination keeps the score's meaning (0..1, how strongly both
signals agree) and needs one interpretable parameter (Bruch, Gai and Ingber,
TOIS 2023). 0.6 leans toward dense because embeddings catch paraphrases that
keyword search misses, but only modestly: the local embedding models this app
can plug in are small, and exact names, error codes and identifiers in a
user's documents are a lexical strength. A passage found by both signals
always beats one found by either alone at the same strength.
