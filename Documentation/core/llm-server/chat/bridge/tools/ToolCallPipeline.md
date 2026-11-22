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
  3. [AutoActivation](../groups/AutoActivation.md): a render into a group that is not
     loaded yet is sent back with the manual; any other call goes on and gets the manual
     appended to its result.
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
- `admitDetached(name, params)`: the admission of a call that will run apart
  from the reply (a background task, through
  [DetachedToolCalls](DetachedToolCalls.md)): the AutoActivation check, the
  argument repair, the required-argument refusal and ApprovalCheck, then the
  vault placeholders. Resolves `{ refusal }` (the result to hand the model) or
  `{ params, manualNote }` (repaired, vault keys filled in), ready for a
  dispatch of its own. `manualNote` is the manual of a group this call loaded
  (`AutoActivation.manualNote`, `''` when it loaded none), for the caller to
  hand the model with its answer, since the call's own result comes later. The loop monitor is not involved: the call is not part of the reply's
  run of calls.

## Vault key placeholders

`vaultCaller` (from BridgeRun: who the run counts as). `_run` passes the call through `VaultPlaceholders.resolveFor` before dispatch, after approval. The dispatched params get the key values; the params the pipeline was given (trace, history) keep the placeholders. A refusal becomes the tool result.

## call_tool (2026-11-20)

`execute` answers [CallToolCall](CallToolCall.md)`.REFUSAL` to a call still
named `call_tool`, right after the botched-call check and before anything is
activated, asked or dispatched: the parser unwraps every `call_tool` that
names a tool, so one that arrives here named nothing to run.
