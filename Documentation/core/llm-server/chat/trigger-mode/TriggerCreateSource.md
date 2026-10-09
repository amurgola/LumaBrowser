# TriggerCreateSource

`core/llm-server/chat/trigger-mode/TriggerCreateSource.js`

Builds the event source of a new trigger from `create_trigger`'s parameters.
Used by [TriggerTools](TriggerTools.md).

## Methods (static)

- `kindOf(params)`: `file`, `page` or `notification` when named, else `webhook`.
- `build(kind, params, services)` returns `{ source }` or `{ error }`:
  - webhook: `{ respond, preset, authHeader }`;
  - notification: needs `host` and/or `tab_partition`; a tab must exist in the
    notification source (`getTab`) and adds `tabPartition`, `tabTitle`, `tabUrl`;
  - file: needs `dir`, validated by `services.validateDir` (its message is the
    error), plus `glob`, `events`, `recursive`, `allowWrite`;
  - page: needs `monitor_id` naming an existing Page Watcher monitor; stores
    `monitorId`, `url`, `name`;
  - then the [TriggerGatingParams](TriggerGatingParams.md) keys, dropping
    `batch_max` or `memory_runs` given alone; a bad `quiet_hours` and a batch
    window on a `respond: result` webhook are refused.

## Why

A result-mode sender waits for the run's answer, so it cannot wait for a batch
window to close. Folder validation goes through the file-watch manager when it
is up because it knows the application's own folders, which must never be
watched.
