# StaleSearchCheck

`core/llm-server/chat/tool-loop/StaleSearchCheck.js`

Notes a search when the latest searches brought almost nothing new. Extends
[LoopCheck](LoopCheck.md).

## Methods

- `inspectOutcome(record, history)`: for a scored search, looks at the
  latest `STREAK` (2) scored searches. If every one is below `NOVELTY_FLOOR`
  (0.2), it returns an annotating finding `{ searches }`.
- `PATTERN` = `stale-search`.

## Why

It catches the paraphrase spiral by its effect, not its wording. Queries can
look different and still keep re-finding the same pages. Under a fifth new
passages means the result set mostly repeats known material, and two in a row
rules out one unlucky query.
