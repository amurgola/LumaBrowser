# YieldingDispatch

`core/llm-server/chat/bridge/tools/YieldingDispatch.js`

The dispatch a chat turn with background tasks runs its tool calls through. It sits
between [ToolCallPipeline](ToolCallPipeline.md) and [ToolDispatch](ToolDispatch.md): a
call the turn's [SlowCallBudget](../../tasks/SlowCallBudget.md) covers is started so that
it can be handed on if it outlives the budget; every other call goes straight to the
plain dispatch.

## Methods

- `new YieldingDispatch({ dispatch, ctx, slowCalls = null })`: `dispatch` is the run's
  `ToolDispatch`, `ctx` the run's tool context. `ctx.detached`
  ([DetachedToolCalls](DetachedToolCalls.md)) is read at call time, because
  [BridgeRun](../BridgeRun.md) builds it after the dispatch. `slowCalls` is null for a
  run that waits for every call (a mode turn, an eval, a scheduled task).
- `dispatch(name, params, browserService)`: with a budget, detached calls and
  `slowCalls.covers(name, detached.kindOf(name))`, resolves
  `slowCalls.settle({ tool, params, call: detached.begin(name, params), ctx })`.
  Otherwise the plain dispatch's result.

The pipeline's checks (required arguments, the approval question) have passed before the
dispatch is reached, so the time the user takes to answer an approval does not count
against the budget.
