# SummaryDirective

`core/llm-server/chat/compaction/SummaryDirective.js`

Data only: the summarize instruction and the summary frame for
[Compaction](../Compaction.md).

## Members

- `SummaryDirective.TEXT`: asks for a summary under eight fixed headings
  (Primary Request and Intent, Key Technical Concepts, Files and Code, Errors
  and Fixes, Pending Jobs, Current Work, Next Step, Critical Context), each
  always present with "(none)" when empty, and to consolidate a prior summary
  rather than copy it.
- `SummaryDirective.MARKER`: `[Summary of the earlier conversation]`.
- `SummaryDirective.wrap(text)`: the marker, then
  `Older messages were condensed to save context.`, a blank line, and the
  trimmed text.

## Why

Fixed headings let a later compaction merge an earlier summary section by
section instead of guessing which headings it used.
