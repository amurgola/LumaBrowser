# ScoreNormalizer

`core/rag/ScoreNormalizer.js`

Puts lexical and dense evidence on one 0..1 scale before blending.

## Methods

- `ScoreNormalizer.bm25Shares(rows)`: `Map id -> strength / best strength`,
  where strength is `-rank` (FTS5's `bm25()` is negated, more negative is
  better). When no row has a positive strength every row gets 1.
- `ScoreNormalizer.cosineAboveFloor(similarity, floor)`: `(similarity - floor)
  / (1 - floor)`, capped at 1; `null` under the floor (not evidence).

## Why

Dividing by the best hit (not min-max) keeps every lexical match above zero:
the weakest of 40 BM25 hits still matched the query and should not score the
same as a passage lexical search never returned. Cosine has a known ceiling of
1, so it is rescaled against fixed bounds rather than the pool, which keeps a
query where nothing is truly similar from looking strong.
