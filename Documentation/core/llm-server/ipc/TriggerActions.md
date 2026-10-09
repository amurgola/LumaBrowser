# TriggerActions

`core/llm-server/ipc/TriggerActions.js`

The triggers sidebar and runs view.

## Methods

- `new TriggerActions({ deps, runConversations, details?, pickPath? })`; `deps` is
  [LlmIpcDeps](LlmIpcDeps.md) (`triggerStore`, `triggerRunner`, `triggerSecrets`,
  `fileWatchManager`, `notificationSource`, `emitTriggersEvent`).
- Reads, empty without a store: `list()` `{ triggers }`, `versions(id)` `{ versions }`,
  `runs(id, opts)` `{ runs }`, `deliveries(id, opts)` `{ deliveries, counts }`,
  `persistedTabs()` `{ tabs }`; `get(id)` is [TriggerDetails](TriggerDetails.md).
- Changes, throwing `triggers unavailable` without a store:
  - `update(id, patch)`, `clearMemory(id)` `{ success: !!trigger, trigger }`, emitting only on a hit;
  - `rollback(id, n)`, `adoptLatestEvent(id)` the store's result, emitting only on success;
  - `delete(id)` (`trigger not found`): run transcripts, folder watch, signing secret, then the row;
  - `setSecret(id, value)` (also needs the secrets store; `trigger not found`), the
    store's result spread, always emitting.
- `pickFile(event, id)` a file in the watched folder: `{ canceled: true }` or
  `{ canceled: false, path }`; `not a file trigger` otherwise.
- Runner calls, `triggers unavailable` without a runner: `test(id)` (`runInline(id, { kind: 'test' })`),
  `approve(runId, decision)`, `simulate(id, body)`, `replay(runId)`.
- `deleteTrigger(trigger)`, `deleteOwnedBy(conversationId)` as in
  [ScheduledTaskActions](ScheduledTaskActions.md), emitting `triggers-changed`.
