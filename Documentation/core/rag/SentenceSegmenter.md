# SentenceSegmenter

`core/rag/SentenceSegmenter.js`

A [SpanSegmenter](SpanSegmenter.md) that cuts prose into sentences.

## Rules

- A run of `.`, `!` or `?` (plus closing quotes or brackets) followed by
  whitespace ends a sentence when the next visible character is not lowercase,
  so `3.5 mm. then` stays whole and `Step one. 2 more` splits.
- A single `.` after a known abbreviation (`ABBREVIATIONS`: e.g., i.e., etc.,
  Dr., ...) or a one-letter initial (`J. Doe`) does not end a sentence.
- CJK full stops (`。！？`) end a sentence with no whitespace needed.
- A line starting a list item (`-`, `*`, `+`, `1.`, `1)`) starts a new span.
- Other line breaks are not cuts: PDF text wraps mid-sentence.

## Members

- `segment(source, start, end)` (inherited).
- `ABBREVIATIONS`, `TERMINATOR`, `LIST_ITEM`.

## Why

There is no NLP model in the main process, and a rule set this small is right
for nearly all sentences; a miss only moves a possible cut point, never loses
text.
