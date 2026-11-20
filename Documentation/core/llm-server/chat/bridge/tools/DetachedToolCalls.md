# DetachedToolCalls

`core/llm-server/chat/bridge/tools/DetachedToolCalls.js`

Lets a session tool run another of the run's tools apart from the reply (a background
task, [BackgroundTaskTools](../../tasks/BackgroundTaskTools.md)). The call passes the same
admission as any other, then runs on a context of its own, so its progress, artifacts
and stop signal belong to the task and outlive the reply that started it.

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

## The task's context

The run's context with everything that pointed at the live reply pointed at the task:

- `hooks`: a tool's `status` events become `task.report({ step, totalSteps, detail })`,
  the task's line in the strip above the composer; `onStatus`, `onArtifact`,
  `onArtifactStream` and `onAgentEvent` go quiet, since there is no reply to stream into;
- `artifacts`: the task's own list, which the results turn shows;
- `isAborted()`: the task's stop flag, not the reply's Stop;
- `detached`: null, so a background call cannot start another.
