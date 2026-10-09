# KnowledgeRetriever

`core/rag/KnowledgeRetriever.js`

Finds the passages that best answer a query in one knowledge-base scope of a
[RagStore](RagStore.md). This page also records the reasoning behind the
retrieval design as a whole.

## Methods

- `KnowledgeRetriever.retrieve(store, scope, query, limit = 5)` resolves
  passages best first: `[{ id, docId, filename, page, text, charStart,
  charEnd, relevance }]` (`relevance` 0..1). The steps of `execute`:
  1. **Prepare**: pool size `limit * POOL_PER_RESULT`; query terms from
     [QueryTermExtractor](QueryTermExtractor.md) into a
     [TermMatcher](TermMatcher.md).
  2. **Lexical evidence**: `store.findKeywordPassages(scope, query, pool)`; each row's
     relevance is its [BM25 share](ScoreNormalizer.md) times
     `(1 - COVERAGE_WEIGHT) + COVERAGE_WEIGHT * coverage`, where coverage is the
     share of query terms the passage contains.
  3. **Dense evidence** (only when [RagEmbedder](RagEmbedder.md) is configured
     and embeds the query): every embedded chunk's cosine, rescaled above
     `COSINE_FLOOR`; the best `pool` kept.
  4. **Blend**: [ConvexScoreFusion](ConvexScoreFusion.md), top `pool`.
  5. **Load**: `store.getChunks`, matched back to the ranking (ids without a row
     are dropped).
  6. **Select**: [DiversitySelector](DiversitySelector.md) picks `limit`.
- Constants: `DEFAULT_LIMIT` (5), `POOL_PER_RESULT` (8), `COVERAGE_WEIGHT`
  (0.5), `COSINE_FLOOR` (0.2).

## Why

- **Scores, not ranks.** Ranks throw away how far apart two hits are. Both
  signals are put on a 0..1 scale and blended convexly; Bruch, Gai and Ingber,
  "An Analysis of Fusion Functions for Hybrid Retrieval" (TOIS 2023) found a
  convex combination of normalised scores beats rank-based fusion in and out of
  domain, and that the normalisation choice matters little. Without an embedder
  the lexical relevance is the answer, so the knowledge base works with no
  embedding model at all.
- **Pool of 8 per result.** Diversity re-ranking needs headroom below the cut:
  with 5 results, 40 candidates leave room for the per-document cap to reach
  other documents and for MMR to skip a run of near-duplicate overlapping
  chunks. FTS5 and an in-process cosine over a personal knowledge base make 40
  rows cheap; it scales with `limit` so a pre-pass asking for 4 asks for 32.
- **Coverage weight 0.5.** BM25 term saturation (FTS5 hard-codes k1 = 1.2)
  lets a chunk repeating one rare word outscore a chunk containing every query
  word. Scaling by coverage at weight 0.5 costs a half-covering passage a quarter
  of its score and a single-term passage at most half: enough to prefer the
  complete answer, not enough to bury a much stronger single-term hit.
- **Cosine floor 0.2.** For general-purpose sentence embedders, unrelated text
  usually sits below about 0.2 cosine. The floor is where the dense scale
  starts (similarity 0.2 maps to 0, 1.0 to 1), so a weak dense-only match
  enters with a proportionally tiny score instead of being cut at a hard
  threshold or outranking a real lexical hit.
- A failing embedder makes `RagEmbedder.embed` return null, so retrieval
  degrades to lexical evidence without reading any embeddings.
