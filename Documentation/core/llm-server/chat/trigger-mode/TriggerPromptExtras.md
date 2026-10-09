# TriggerPromptExtras

`core/llm-server/chat/trigger-mode/TriggerPromptExtras.js`

Gathers the live context a trigger setup prompt lists. Used by
[TriggerMode](../TriggerMode.md).

## Methods (static)

- `build(services, triggerStore, trigger)` returns an object with whichever of
  these are available:
  - `agents`: `services.listAgents()`;
  - `tabs`: the notification source's `listTabs()`;
  - `monitors`: the Page Watcher's `listMonitors()` (`[]` when it is up but
    fails to list);
  - `artifacts`: the artifact store's `listLiveRoots({ limit: 40 })`;
  - for an existing trigger: `secret` (`services.secretStatus`),
    `pendingApproval` (`{ tool, detail, since, note }` from the runner's
    `pendingApproval(id)`), `deliveries` (the 6 newest as `{ at, source,
    outcome, detail }`) and `versions` (the 5 newest).
- A source that is missing or throws is left out.
