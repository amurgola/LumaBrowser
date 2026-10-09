# InertActionCheck

`core/llm-server/chat/tool-loop/InertActionCheck.js`

Notes a browser action that keeps changing nothing. Extends
[LoopCheck](LoopCheck.md).

## Methods

- `inspectOutcome(record, history)`: when the record has an `inertKey`
  (see [CallRecord](CallRecord.md)), counts the calls that ran with that
  key. More than `TOLERATED` (2) returns an annotating finding `{ times }`.
- `PATTERN` = `inert-action`.

## Why

This covers the looser web-agent loop: click ref 7, screenshot, click ref 7.
Every click "succeeds" and nothing moves. Reads in between don't reset it,
because the key is tool, target and page state. Two misses can be timing (an
animation or a slow handler), but a third on an unchanged page means the target
is wrong. It never blocks: the action already ran.
