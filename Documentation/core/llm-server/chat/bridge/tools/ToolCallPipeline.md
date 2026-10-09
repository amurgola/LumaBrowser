# ToolCallPipeline

`core/llm-server/chat/bridge/tools/ToolCallPipeline.js`

The checks one tool call passes on its way to running, then the notes that
ride back on its result.

## Methods

- `new ToolCallPipeline({ toolSet, loopMonitor, health, approval, dispatch })`;
  `loopMonitor` is the run's [ToolLoopMonitor](../../ToolLoopMonitor.md).
- `execute(name, params, browserService)`:
  1. `MALFORMED_TOOL` -> `{ success: false, error: MALFORMED_CALL }`.
  2. `activate_tools` -> [ActivateToolsCall](../groups/ActivateToolsCall.md).
  3. [AutoActivation](../groups/AutoActivation.md): a bounce returns.
  4. [BareArgumentRepair](../../BareArgumentRepair.md) over
     `toolSet.requiredArgs`, then `loopMonitor.attempt(name, args, run)`: a
     held call returns its feedback result; steps 5-7 are `run`, which reports
     `{ result, ran }` (`ran: false` for a refusal below).
  5. `requiredArgs.refusal` (counted as a missing-arg call).
  6. [ApprovalCheck](ApprovalCheck.md).
  7. [ToolDispatch](ToolDispatch.md), then `withSoftMissingNote`, ledger
     the monitor's `loopNotice` on the result, mid-run
     admission on `toolCatalogChanged` (`Now callable in this run: ...` plus
     manuals, appended to `message`, `next`, or set as `message`), and the
     auto-activation manual (only on a call that ran).
