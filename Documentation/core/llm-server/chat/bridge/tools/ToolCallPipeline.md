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
- `admitDetached(name, params)`: the admission of a call that will run apart
  from the reply (a background task, through
  [DetachedToolCalls](DetachedToolCalls.md)): the AutoActivation bounce, the
  argument repair, the required-argument refusal and ApprovalCheck, then the
  vault placeholders. Resolves `{ refusal }` (the result to hand the model) or
  `{ params }` (repaired, vault keys filled in), ready for a dispatch of its
  own. The loop monitor is not involved: the call is not part of the reply's
  run of calls.

## Vault key placeholders

`vaultCaller` (from BridgeRun: who the run counts as). `_run` passes the call through `VaultPlaceholders.resolveFor` before dispatch, after approval. The dispatched params get the key values; the params the pipeline was given (trace, history) keep the placeholders. A refusal becomes the tool result.
