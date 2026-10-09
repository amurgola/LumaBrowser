# ToolBatchRunner

`core/llm-server/agent/ToolBatchRunner.js`

Runs one reply's tool calls in model order.

## Methods

- `new ToolBatchRunner({ executor, guard, compactor, toolResultBudget, history,
  verifier, workTab, clock, toolCalls, steps, emit, shouldAbort, maxParallel,
  noBrowser })`.
- `run(iteration, batch, content, carriedNotes)` resolves to `{ aborted }`.

## Rules

- The mode ([ToolConcurrency](../../llm-service/ToolConcurrency.md)`.executionMode`)
  is read right before each call starts. Parallel calls share a pool of
  `maxParallel`; an exclusive call drains the pool, runs alone and is committed
  before the next call is classified.
- A second exclusive call after one actually ran is deferred: it was written
  before its author saw the first one land. It is reported as a `[Tool Result
  for X]: Not executed...` message (Compaction cuts by that prefix). Reads after
  a state change still run.
- [ToolCallGuard](ToolCallGuard.md) runs per call; a rejection holds its place
  in model order, takes no pool slot and does not count as a state change.
- In lazy mode only [WorkTab](WorkTab.md)`.needsWorkTab` tools create the tab.
- Commit, in model order: extend the clock by the tool's duration, update the
  verifier, record `toolCalls` and the step (`batchSize` only for
  real batches), emit `tool-result`, compact the result with
  [ToolResultCompactor](ToolResultCompactor.md) and push it; a result with
  `imageBase64` marks the screenshot note.
- The carried notes ride on the first result of the batch only.
- `shouldAbort` is checked between calls.
