# TriggerDetails

`core/llm-server/ipc/TriggerDetails.js`

Everything a trigger's card shows beyond the stored row.

## Methods

- `new TriggerDetails({ deps, agentManager? })`; `agentManager` is a getter, default
  `() => global.__lumaAgentManager`.
- `get(id)` returns `{ trigger, baseUrls, watch, secret, pending, versions, agent }`:
  - `baseUrls` `getHookBaseUrls()` for a webhook trigger;
  - `watch` `fileWatchManager.status(id)` for a file trigger;
  - `secret` `{ required, set, encrypted }` for a webhook trigger
    (`WebhookPresets.requiresSecret`); the value never leaves the main process;
  - `pending` `{ retry, batch, approval, deferred }` from the runner's optional methods;
  - `versions` `triggerStore.versionInfo(id)`;
  - `agent` `{ id, name, missing }` for `action.agentId` (a deleted agent is `missing: true`).
  Each part is null when it does not apply.
