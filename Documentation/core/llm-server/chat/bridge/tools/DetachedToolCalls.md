# DetachedToolCalls

`core/llm-server/chat/bridge/tools/DetachedToolCalls.js`

Runs one of the run's tools apart from the reply (a background task,
[BackgroundTaskTools](../../tasks/BackgroundTaskTools.md)). A session tool starts one
there: the call passes the same admission as any other, then runs on a context of its
own, so its progress, artifacts and stop signal belong to the task and outlive the reply
that started it. A call the reply made directly can be begun so that it is handed to a
task while it runs ([YieldingDispatch](YieldingDispatch.md)).

Built by [BridgeRun](../BridgeRun.md) over the run's pipeline, tool table and tool set,
and set on the tool context as `ctx.detached`, which
[ToolDispatch](ToolDispatch.md) hands to session tools.

## Methods

- `allows(name)`: the run's allow-list lets the model call the tool at all.
- `kindOf(name)`: `builtin` (a [ChatToolTable](ChatToolTable.md) handler), `session` (an
  injected tool), `extension` (an extension or MCP tool), or null for anything else: the
  browser tools, which work on the reply's own tab, and names nobody answers.
- `admit(name, params)`: [ToolCallPipeline](ToolCallPipeline.md)`.admitDetached`.
  Resolves `{ refusal }` or `{ params }` (repaired, vault keys filled in).
- `run(name, params, task)`: a fresh `ToolDispatch` on the task's context. `task` is
  `{ report, isStopped, artifacts }` of the task it belongs to. Resolves the tool's
  result; a throw becomes `{ success: false, error: "<name> failed: ..." }`, so it never
  rejects.

- `begin(name, params)`: starts one admitted call inside the reply so that it can be
  handed on. Returns `{ pending, handTo(task) }`: `pending` resolves the tool's result
  and never rejects; until `handTo(task)` the call's progress, artifacts and stop signal
  are the reply's, from then on that task's. The context it runs on reads `hooks`,
  `artifacts` and `isAborted` through its current owner at the moment they are used,
  and keeps the `hooks` object and the `isAborted` function the same throughout, since a
  tool may hold on to them for its whole run ([ToolProgress](ToolProgress.md) does).
- `HOOKS`: the five hooks a tool sends through (`onToolEvent`, `onStatus`, `onArtifact`,
  `onArtifactStream`, `onAgentEvent`).

## The task's context

The run's context with everything that pointed at the live reply pointed at the task:

- `hooks`: a tool's `status` events become `task.report({ step, totalSteps, detail })`,
  the task's line in the strip above the composer; `onStatus`, `onArtifact`,
  `onArtifactStream` and `onAgentEvent` go quiet, since there is no reply to stream into;
- `artifacts`: the task's own list, which the results turn shows;
- `isAborted()`: the task's stop flag, not the reply's Stop;
- `detached`: null, so a background call cannot start another.
