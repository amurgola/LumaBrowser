# LineSegmenter

`core/rag/LineSegmenter.js`

A [SpanSegmenter](SpanSegmenter.md) that cuts a range into one span per
non-blank line.

## Methods

- `segment(source, start, end)` (inherited).

## Why

Used by [BlockUnitizer](BlockUnitizer.md) only for code fences and tables that
are larger than the budget: a statement or a table row is the smallest piece
that still reads on its own.
