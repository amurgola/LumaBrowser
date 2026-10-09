# PassageSimilarity

`core/rag/PassageSimilarity.js`

How alike two candidate passages are, 0..1, for
[DiversitySelector](DiversitySelector.md).

## Methods

- `PassageSimilarity.between(a, b)` with `{ vector?, words: Set }` candidates:
  cosine of the embeddings (negative clamped to 0) when both have a vector,
  otherwise the Jaccard overlap of their folded word sets
  ([WordTokenizer](WordTokenizer.md)`.foldedSet`).

## Why

Diversity must work without an embedder too. Word-set overlap is a cheap,
model-free signal that is high exactly where it matters: overlapping
neighbouring chunks and repeated boilerplate.
