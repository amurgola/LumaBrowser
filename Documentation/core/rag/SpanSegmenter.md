# SpanSegmenter

`core/rag/SpanSegmenter.js`

Base class of the segmenters ([SentenceSegmenter](SentenceSegmenter.md),
[LineSegmenter](LineSegmenter.md)). A subclass only overrides
`_cutPoints(source, start, end)`, returning ascending offsets where a new span
begins; the base turns the pieces between cuts into tight spans.

## Methods

- `segment(source, start = 0, end = source.length)` returns `[{ start, end }]`
  in source order; whitespace-only pieces are skipped.
- `SpanSegmenter.tighten(source, start, end)`: the narrowest range inside
  `[start, end)` holding every non-whitespace character, or `null`.

## Why

Spans are tight from the moment they are cut, so every later stage works with
exact offsets and never has to trim or re-measure text.
