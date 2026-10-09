# LexicalMatchExpression

`core/rag/LexicalMatchExpression.js`

Builds the SQLite FTS5 `MATCH` expression for a query.

## Methods

- `LexicalMatchExpression.fromText(text)`: the expression for
  [QueryTermExtractor](QueryTermExtractor.md)`.extract(text)`.
- `LexicalMatchExpression.fromTerms(terms)`: each term as an FTS5 bareword,
  `stem*` for a prefix term and `word` otherwise, any of them matching
  (`'Where are the chloroplasts in a leaf?'` -> `chloroplast* OR leaf*`).
  `''` for no terms; [RagStore](RagStore.md) treats that as no hits.

## Why

FTS5 barewords may contain only letters, digits and non-ASCII characters, and
the terms are built from exactly those, lowercased, so user punctuation,
quotes, brackets, column filters or `AND`/`OR`/`NOT`/`NEAR` operators can never
reach the FTS5 parser as syntax (tested against a real FTS5 table). Any term
matching gives recall; ranking is left to BM25 and the term-coverage weighting
in [KnowledgeRetriever](KnowledgeRetriever.md).
