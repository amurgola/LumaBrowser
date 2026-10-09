# SourceCardBuilder

`core/rag/SourceCardBuilder.js`

Builds the source cards the chat UI shows for a knowledge-base answer (the
`sources` of a lookup, sent as the `citations` agent event).

## Methods

- `SourceCardBuilder.build(passages, terms)` returns one card per passage:

  ```
  {
    ref: 'S1',                                   // the tag the model cites, [S1]
    document: { id, name },                      // name: filename or null
    passage: { id, page, start, end },           // chunk id, page, char offsets (nulls when unknown)
    relevance: 0.873,                            // 0..1, 3 decimals; 0 when invalid
    excerpt: { text, marks: [[start, end], ...] } // ExcerptWindow, highlighted with the query terms
  }
  ```

- `SourceCardBuilder.RELEVANCE_DECIMALS` (3).

## Why

Grouping by what the UI needs (which document, where in it, how relevant, what
it says) means a sources panel renders a card without a second lookup.
`ref` is the join key with the answer text ([CitationTag](CitationTag.md)).
