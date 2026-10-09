# TriggerRunner

`core/llm-server/chat/TriggerRunner.js`

Executes trigger fires: an inbound event (webhook, file, page change,
notification) routed into a background agent run. Real deliveries are gated,
then queued per trigger and drained one run at a time on a private
[AgentChatBridge](AgentChatBridge.md). A facade over the classes in
`trigger-runner/`; [TriggerStore](TriggerStore.md) owns the state.

## Methods

- `new TriggerRunner({ triggerStore, settingsDb?, getAgentDeps, getRouter,
  emitEvent?, gate?, pageSource?, notify?, getAgentManager?, bridgeFactory? })`.
  Throws `TriggerRunner requires a triggerStore`. `getRouter` returns the
  UnifiedChatRouter (only `active` and `chatStore` are read); `gate` is the
  shared [BackgroundRunGate](BackgroundRunGate.md) (private when omitted);
  `pageSource` (public field, settable later) serves page samples;
  `notify({ kind, triggerId, title, body })` is the desktop notifier
  (`approval`, `failed`, `auto-paused`, `drift`); `getAgentManager()` returns
  agent-manager's `{ buildTurn }` or null; `bridgeFactory(router)` defaults to
  `new AgentChatBridge({ router })` (tests inject a fake).
- `fire(triggerId, event, { kind = 'event', dedupeKey, source = 'webhook', remote })`
  returns `{ accepted, reason, done, deliveryId? }` synchronously, plus
  `filtered` / `loopGuard`, `retryAfterS`, `resumesAt`, `deferred`, `batched` /
  `batchSize` or `drift` as they apply. `done` resolves with the finished run
  row (with `responseBody`, `shapeError`, `toolTrace`) or null when the fire
  was dropped. Refusal reasons: `trigger not found` (not logged), `trigger not
  armed`, `duplicate delivery`, `runner stopped`, `filtered`, `cooldown`,
  `quiet_hours`.
- `deliver(triggerId, event, { dedupeKey, source })`: the non-HTTP sources'
  entry. No sample yet: captured (`{ accepted: true, captured: true }`); not
  armed: `{ accepted: false, reason: 'trigger not armed' }`; armed: `fire`.
- `runInline(triggerId, { kind = 'test', event })`: runs now, skipping the
  streaming-chat defer and all gating; refuses while a run is in progress or
  the gate is held (`another background run (<owner>) ...`). A `test` records
  `last_test`. Returns `{ success, run, gating? }` (gating from
  [TriggerAdmission](trigger-runner/TriggerAdmission.md)`.report`).
- `simulate(triggerId, body)`: a typed sample. No sample yet: captured; not
  armed: an inline test; armed: a manual run. Logs a `simulate` delivery.
- `replay(runId)`: re-runs a past run's stored event as `replay`.
- `eventFor(trigger, body)`: see [TriggerSampleEvent](trigger-runner/TriggerSampleEvent.md).
- `gatingReport(trigger, event)`, `describeRunTools(conversationId)`.
- Card state: `queueDepth(id)`, `batchDepth(id)`, `deferredStatus(id)`,
  `pendingRetry(id)`, `pendingApproval(id?)`; `approve(runId, decision)`.
- `stop()`: drops (and logs) quiet-hours holds, pending retries, open batch
  windows and queued fires; every waiter gets null.
- Statics: `DEFER_MS` (15 s), `RUN_TIMEOUT_MS` (5 min), `QUEUE_DEPTH` (20),
  `APPROVAL_HOLD_MS` (30 min), `GATE_OWNER` (`'triggers'`),
  `backoffMs(base, attempt)`, `retryable(errorText, { shapeError })`.

## How a fire flows

1. `fire` refuses unarmed (real events only), duplicate and stopped.
2. Real events: [TriggerAdmission](trigger-runner/TriggerAdmission.md) (loop
   guard, filter, cooldown), then quiet hours ('skip' refuses, 'defer' holds in
   [QuietHoursHold](trigger-runner/QuietHoursHold.md)), then
   [TriggerDriftCheck](trigger-runner/TriggerDriftCheck.md) notes drift, then a
   batch goes to [TriggerBatchWindows](trigger-runner/TriggerBatchWindows.md)
   and everything else to the [TriggerRunQueue](trigger-runner/TriggerRunQueue.md).
3. The drain runs the next item when the router is up, no user chat streams
   and the gate is free; otherwise it re-checks after `DEFER_MS`.
4. [TriggerRunExecution](trigger-runner/TriggerRunExecution.md) runs it under
   a [HeldGate](trigger-runner/HeldGate.md); a retryable failure goes to
   [TriggerRetryScheduler](trigger-runner/TriggerRetryScheduler.md) and the
   waiters wait for the chain's final run.
