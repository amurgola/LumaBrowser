# LoopCheck

`core/llm-server/chat/tool-loop/LoopCheck.js`

Base class for the loop monitor's checks.

## Methods

- `new LoopCheck(pattern)`; `pattern`.
- `inspectRequest(record, history)`: a held [LoopFinding](LoopFinding.md)
  or `null` (default `null`). Runs before the call.
- `inspectOutcome(record, history)`: an annotating finding or `null`
  (default `null`). Runs after a call that ran.
- `_hold(record, facts)`, `_annotate(record, facts)`: finding builders.

## Why

Each loop pattern is its own small class with the same two hooks, so adding a
pattern means adding a check, not editing the monitor. Subclasses:
[IdenticalStreakCheck](IdenticalStreakCheck.md),
[EchoedLookupCheck](EchoedLookupCheck.md),
[SearchAllowanceCheck](SearchAllowanceCheck.md),
[InertActionCheck](InertActionCheck.md), [StaleSearchCheck](StaleSearchCheck.md).
