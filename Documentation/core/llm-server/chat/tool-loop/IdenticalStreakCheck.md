# IdenticalStreakCheck

`core/llm-server/chat/tool-loop/IdenticalStreakCheck.js`

Holds back a call identical to the calls straight before it, for any tool.
Extends [LoopCheck](LoopCheck.md).

## Methods

- `inspectRequest(record, history)`: held with `{ times }` once
  `TOLERATED` (3) identical calls already precede it. Any different call in
  between resets the streak.
- `PATTERN` = `identical-streak`.

## Why

When nothing else ran in between, the state the call reads can't have moved.
Three are tolerated because a page that is still loading can justify a second
and third read. An observed failure was ten identical `observe_page` calls
using up the whole step budget.
