# OverflowRecovery

`core/llm-server/agent/OverflowRecovery.js`

Answers a provider-confirmed "request does not fit"
([ContextOverflow](ContextOverflow.md)) instead of ending the turn.

## Methods

- `new OverflowRecovery({ history, compactor, sender, steps })`, `count`.
- `recover(iteration, result)` returns the completion to use. When `result`
  is an overflow and fewer than `MAX_PER_RUN` (4) recoveries happened:
  1. calibrate from the error's token count;
  2. evict tool history to half the hard ceiling (48000 / 2 when unknown,
     never under 4000), then shrink an oversized newest result in place;
  3. force a compaction of the turn;
  4. only if the request shrank: record an `overflowRecovery` step, retry; if
     that also overflows and another compaction frees something, retry once more.

A recovery that frees nothing returns the original error: the fixed cost itself
does not fit, and an unchanged request is the same 400.
