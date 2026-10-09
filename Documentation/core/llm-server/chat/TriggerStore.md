# TriggerStore

`core/llm-server/chat/TriggerStore.js`

Reactive triggers (`llm_triggers`, see
[TriggerTablesSchema](../../database/settings/schema/TriggerTablesSchema.md)):
inbound-event reactions the user defined in the `trigger` chat mode, with
their runs, delivery log and instruction history. A thin facade over the
classes in `trigger-store/`. It owns state only; TriggerRunner executes.

## Lifecycle

Derived, never stored ([TriggerLifecycle](trigger-store/TriggerLifecycle.md)):
a trigger starts `awaiting_sample`, becomes `needs_test` once it has a sample,
`tested` when the last test passed against its current config hash, and only
then can be `armed`. A failure streak can leave it `auto_paused`. Any change
to what a test vouches for (prompt, mode, respond, allowWrite, expect,
agentId, artifactRootId) disarms it.

## Methods

Statics: `newTriggerId()` (`trig_...`), `newRunId()` (`trun_...`),
`newHookToken()`, `configHash(t)`, `isArmable(t)`, `statusOf(t)`,
`normalizeSource(kind, s)`, `normalizeAction(a)`, `normalizeMemory(m)`,
`memoryPolicy(t)`, `approvalPolicy(t)`, `failurePolicy(t)`. Constants:
`KINDS`, `MODES`, `RESPOND`, `FILE_EVENTS`, `PRESETS`, `DELIVERY_OUTCOMES`,
`APPROVAL_MODES`, `DEFAULT_AUTO_PAUSE_AFTER`, `DEFAULT_RETRY_MAX`,
`DEFAULT_RETRY_BACKOFF_MS`, `DEFAULT_MEMORY_RUNS`, `DEFAULT_MEMORY_CHARS`,
`KEEP_DELIVERIES`, `KEEP_VERSIONS`, `MAX_EVENT_CHARS`, `HOOK_TOKEN_RE`.

Instance (`new TriggerStore({ settingsDb })`, which borrows `settingsDb.db`):

- `create({ conversationId, title?, kind = 'webhook', source?, action })`: never
  armed at birth; a webhook gets a hook token. Throws
  `a trigger needs the setup conversationId`, `unsupported trigger kind: <k>`,
  or the source/action normalisation errors. Records version 1 (`create`).
- `get(id)`, `getByToken(token)` (shape-checked first), `list()` (newest first),
  `listWithRunCounts()` (adds `runCount`), `listByConversation(id)` (oldest
  first), `getByConversation(id)`.
- `update(id, { title?, source?, action?, enabled?, origin?, note? })`: shallow
  merges; explicit nulls clear optional keys. Arming an untested config throws
  `trigger cannot be armed until a test of its current configuration passes`;
  a hash-moving change disarms; re-arming by hand clears an auto-pause and its
  streak. An action change appends a version (`origin` edit, chat or rollback).
- `listVersions(id)`, `versionInfo(id)`, `rollbackTo(id, n)` returns
  `{ success, trigger, restored, restoredTest, version }` or `{ success: false, error }`.
- `approveTool(id, name)`: adds to the always-allow list.
- `setSample(id, sample)` (clears drift), `recordDrift(id, drift, { runId })`
  returns `{ isNew, drift }`, `clearDrift(id)`, `adoptLatestEvent(id)`.
- `setMemory(id, text)` (capped to the memory policy), `clearMemory(id)`.
- `recordTest(id, { ok, runId, error })`: against the current config hash; a
  pass marks the versions with that hash as tested.
- `recordFire(id, { status, error })` returns `{ consecutiveFailures,
  firstFailure, autoPaused, pausedReason }` (see [FailureStreak](trigger-store/FailureStreak.md)).
- Delivery log ([TriggerDeliveryLog](trigger-store/TriggerDeliveryLog.md)):
  `recordDelivery`, `updateDelivery`, `getDelivery`, `listDeliveries`, `deliveryCounts`.
- Runs ([TriggerRunLog](trigger-store/TriggerRunLog.md)): `hasRunForDedupeKey`,
  `recordRunStart`, `recordRunFinish`, `getRun`, `listRuns`,
  `pruneTranscripts(id, keep = 20)`, `runConversationIds(id)`.
- `delete(id)`: removes runs, deliveries and versions too; returns whether the trigger existed.

## Classes

Normalisation: [TriggerSourceConfig](trigger-store/TriggerSourceConfig.md),
[TriggerActionConfig](trigger-store/TriggerActionConfig.md),
[TriggerPatch](trigger-store/TriggerPatch.md); policies
([TriggerPolicy](trigger-store/TriggerPolicy.md) base):
[TriggerFailurePolicy](trigger-store/TriggerFailurePolicy.md),
[TriggerApprovalPolicy](trigger-store/TriggerApprovalPolicy.md),
[TriggerMemoryPolicy](trigger-store/TriggerMemoryPolicy.md); records:
[DriftRecord](trigger-store/DriftRecord.md), [CappedJson](trigger-store/CappedJson.md),
[DeliveryEventSummary](trigger-store/DeliveryEventSummary.md),
[HookToken](trigger-store/HookToken.md), [TriggerRowMapper](trigger-store/TriggerRowMapper.md);
history: [TriggerVersionHistory](trigger-store/TriggerVersionHistory.md); raw SQL:
[TriggerRepository](trigger-store/TriggerRepository.md),
[TriggerRunRepository](trigger-store/TriggerRunRepository.md),
[TriggerDeliveryRepository](trigger-store/TriggerDeliveryRepository.md),
[TriggerVersionRepository](trigger-store/TriggerVersionRepository.md).
