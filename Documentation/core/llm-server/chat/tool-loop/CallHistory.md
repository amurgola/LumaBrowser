# CallHistory

`core/llm-server/chat/tool-loop/CallHistory.js`

The ordered list of every tool call requested in one run.

## Methods

- `open(name, params)`: appends and returns a [CallRecord](CallRecord.md),
  numbered from 1; `size`.
- `identicalRunBefore(record)`: how many calls straight before it share its
  signature.
- `lastSucceededBefore(record, test)`: the latest earlier call that ran,
  succeeded and passes `test`, or `null`.
- `countRan(test)`, `latestRan(test, count)` (newest first).

## Why

The checks ask questions of the history instead of each keeping its own
counters, so they share one consistent view of the run.
