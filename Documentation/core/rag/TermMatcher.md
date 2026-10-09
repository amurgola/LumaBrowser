# TermMatcher

`core/rag/TermMatcher.js`

Finds where query terms occur in a passage, matching the way lexical search
does: exact for short words, stem prefix for long ones, on folded words.

## Methods

- `new TermMatcher(terms)` with [QueryTermExtractor](QueryTermExtractor.md) terms.
- `spans(text)` returns `[{ start, end, stem }]` for every matching word, in
  text order (offsets into the original text).
- `coverage(text)` is the share of distinct terms present, 0..1 (0 without terms).

## Why

One matcher feeds both term coverage in
[KnowledgeRetriever](KnowledgeRetriever.md) and the highlighted excerpts of
[SourceCardBuilder](SourceCardBuilder.md), so what is scored and what is shown
agree.
