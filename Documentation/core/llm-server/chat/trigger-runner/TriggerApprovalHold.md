# TriggerApprovalHold

`core/llm-server/chat/trigger-runner/TriggerApprovalHold.js`

Approval holds for triggers with `source.approval = 'ask'` (see
[TriggerApprovalPolicy](../trigger-store/TriggerApprovalPolicy.md)). When the
bridge raises an approval for a mutating tool the run parks: the run clock
stops, the shared gate is handed back so scheduled work is not blocked by an
unanswered question, and the user is notified. Runs serialize, so at most one
run is parked.

## Methods

- `new TriggerApprovalHold({ triggerStore, emitEvent?, notify?, getBridge })`.
- `onRequest(trigger, runId, ev, control)`: a tool on the trigger's
  `approvedTools` is answered `run` on the next tick (the bridge registers its
  wait right after emitting) and emits `approval-auto`. Otherwise the run is
  parked, `control.pause()` is called, `approval-needed` is emitted and
  `notify({ kind: 'approval', title: 'Trigger needs your approval: <title>' })`.
- `onDone(trigger, runId, ev, control)`: unparks, `control.resume()` when it was
  parked, emits `approval-done`.
- `pending(triggerId?)`: `{ runId, triggerId, tool, detail, since, params }`
  (params is a 400-character JSON preview) or null.
- `approve(runId, decision)`: `allow` -> `once`, `allow_run` -> `run`,
  `allow_always` -> `run` and the tool is added to the trigger's always-allow
  list, `deny` -> `reject`; answered through the bridge's `respondApproval`.
  Errors: `nothing is waiting for approval on that run`, `decision must be
  allow, allow_run, allow_always or deny`, `the run is no longer waiting`.
- `clearFor(triggerId)`: the run ended.
