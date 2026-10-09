# TriggerRunExecution

`core/llm-server/chat/trigger-runner/TriggerRunExecution.js`

One trigger run from start to finish, built by [TriggerRunner](../TriggerRunner.md)
for each run it starts.

## Methods

- `new TriggerRunExecution(services, trigger, event, { kind, dedupeKey,
  deliveryId, deliveryIds, attempt, retryOf, source, resolvers })`. `services`:
  `{ triggerStore, settingsDb, runtime() -> { deps, chatStore, bridge },
  heldGate, logger, emitEvent, runConfig, approvalHold, retries,
  failureNotifier }`.
- `execute()`: resolves `{ run, retryPending }`. `run` is the finished run row
  plus `responseBody` (when respond_to_webhook set one), `shapeError` and
  `toolTrace`, or null when the run failed before its row existed.
- Statics: `RUN_TIMEOUT_MS` (5 min), `APPROVAL_HOLD_MS` (30 min),
  `KEEP_TRANSCRIPTS_KEY` (`core.triggers.keepTranscripts`).

## Steps

1. Memory block ([TriggerRunPrompt](TriggerRunPrompt.md)) and, for a retry, the
   previous attempt's error.
2. Runtime check (`agent runtime is not ready`), run config
   ([TriggerRunConfig](TriggerRunConfig.md)), hidden transcript `<title> fire
   ...`, run row, the queued delivery rows moved to `fired` (`run started`,
   `retry attempt N started`, `batch run of N`), `run-started`.
3. The user message (`TriggerPayload.buildUserMessage`) and the bridge run
   through [CapturedBridgeRun](../schedulers/CapturedBridgeRun.md): run-scoped
   tools ([TriggerRunTools](TriggerRunTools.md)) added to the allow-list,
   approval `ask` or `never`, `approvalTimeoutMs` = `APPROVAL_HOLD_MS`, the
   agent's `kbScope`. Approval tool events go to
   [TriggerApprovalHold](TriggerApprovalHold.md) with a control that pauses the
   clock and hands the [HeldGate](HeldGate.md) back, then resumes and retakes it.
4. Verdict: a bridge error, else a [TriggerResultShape](TriggerResultShape.md)
   mismatch, fails the run.
5. Real events only: a retryable failure goes to
   [TriggerRetryScheduler](TriggerRetryScheduler.md); otherwise
   [TriggerFailureNotifier](TriggerFailureNotifier.md) records the fire.
6. Transcript pruning, `run-finished` `{ triggerId, runId, kind, status, title,
   retryPending }`.

A thrown step records the run as error (or the delivery as `error` when no run
row exists), still retries or counts for real events, and emits `run-finished`.
