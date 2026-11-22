# SlowCallBudget

`core/llm-server/chat/tasks/SlowCallBudget.js`

How long a tool call the model made directly may hold up its reply. A call that is still
going when the time is up is handed on (it becomes a background task) and the model is
answered at once, so the reply moves on instead of sitting silent until the call returns.
The model does not have to decide beforehand whether a call is slow.

One instance per chat turn, built by [BackgroundTaskTools](BackgroundTaskTools.md) (its
`slowCalls`) and used by the run's [YieldingDispatch](../bridge/tools/YieldingDispatch.md).

## Methods

- `new SlowCallBudget({ handOn, budgetMs = BUDGET_MS, now })`: `handOn({ tool, params,
  call, ctx, startedAt, waitedMs })` takes over a call that outlived the budget and
  returns what the model is answered instead of its result. `now` is a test seam.
- `BUDGET_MS`: 8000.
- `covers(tool, kind)`: [BackgroundTaskRules](BackgroundTaskRules.md)`.yields`. Extension
  and MCP tools that may run in the background are timed; a render, the browser tools,
  the built-ins and the tools that stay in the reply are not.
- `settle({ tool, params, call, ctx })`: `call` is `{ pending, handTo(task) }` from
  [DetachedToolCalls](../bridge/tools/DetachedToolCalls.md)`.begin`. Resolves the call's
  own result when it ends within the budget. A reply that was stopped meanwhile
  (`ctx.isAborted()`) keeps waiting for its call and nothing is handed on. Otherwise
  resolves what `handOn` answers.

## Why a time budget

Before this, a slow call either blocked the reply for its whole length or had to be
started with `run_in_background`, which the model had to choose up front and which ended
the reply. Coding agents converged on the same answer: the call gets a few seconds, then
returns "still running" with a handle. Eight seconds keeps quick calls (a page read, a
short command) inside the reply, where their result is used at once, and costs a slow
call one extra model step.
