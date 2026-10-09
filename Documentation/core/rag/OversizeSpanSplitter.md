# OversizeSpanSplitter

`core/rag/OversizeSpanSplitter.js`

Last resort for one span (a run-on sentence, a minified line, a huge table row)
longer than the budget.

## Methods

- `new OversizeSpanSplitter(maxChars)`.
- `split(source, { start, end })` returns tight spans of at most `maxChars`,
  each cut at the last whitespace that fits, or at `maxChars` when there is
  none (never between the halves of a surrogate pair).

## Why

Guarantees every unit fits a chunk, so [ChunkPacker](ChunkPacker.md) never has
to handle an unplaceable unit.
