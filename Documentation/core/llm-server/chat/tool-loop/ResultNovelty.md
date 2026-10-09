# ResultNovelty

`core/llm-server/chat/tool-loop/ResultNovelty.js`

Measures how much of a tool result is new to the run.

## Methods

- `measure(result)`: collects every string in the result (depth 8), splits
  it into lines and sentences, keeps normalised passages of at least
  `MIN_PASSAGE_CHARS` (24), up to `MAX_PASSAGES` (2000). Returns the share
  not seen in any earlier result, then remembers them. Returns `null` for
  failures, non-objects and results with no such passage.

## Why

It is a progress measure that does not depend on how a query was worded. A
search that only re-finds known pages scores near zero. Short fragments
(labels, "Results:") recur in unrelated results, so they are ignored. The cap
bounds the cost of a large page read.
