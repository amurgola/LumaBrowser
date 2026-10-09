# TraceTable

`cli/lib/trace/TraceTable.js`

Fixed-width rows for `luma trace`.

## Methods (static)

- `TraceTable.fileRow(f)`: id (40), size in KB (10), ISO mtime.
- `TraceTable.header()`, `TraceTable.callRow(r)`: `#`, turn, call type, model (28),
  `prompt/completion` tokens, time to first token, total time, then the response preview (80 chars):
  `ERROR <error>`, or `[N tool call(s)] ` plus the text.
- `TraceTable.turnIndex(records)`: a function giving each record's 1-based turn, in order of first
  appearance of its `turnId` (`(none)` counts as one).
- Cell helpers: `pad`, `num`, `ms`, `kb`, `firstLine`.
