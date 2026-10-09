# DiversitySelector

`core/rag/DiversitySelector.js`

Picks the final passages from a relevance-ranked pool.

## Methods

- `DiversitySelector.select(candidates, limit)` takes
  `[{ docId, relevance, vector?, words }]` and returns up to `limit` of them in
  pick order. Each step picks the candidate with the highest Maximal Marginal
  Relevance, `0.7 * relevance - 0.3 * (highest similarity to an already
  picked passage)` ([PassageSimilarity](PassageSimilarity.md)), among
  candidates whose document holds fewer than `ceil(limit / 2)` picks; only when
  no such candidate is left may a capped document take more.
- `DiversitySelector.RELEVANCE_BALANCE` (0.7).

## Why

- **MMR** (Carbonell and Goldstein, 1998) removes redundancy without a
  separate dedup step. The chunker overlaps neighbouring chunks, so the top of
  a raw ranking is often the same sentences twice.
- **Balance 0.7** keeps relevance in charge: an exact duplicate loses 0.3,
  about the gap between a top passage and a middling one, so diversity only
  decides between passages of similar relevance. Lower values (0.5 is a common
  default) trade too much accuracy for variety at five results.
- **Soft cap of half the slots**, rounded up (3 of 5, 2 of 4), means one long
  document cannot crowd out a second relevant one, yet a knowledge base with a
  single document still fills every slot.
