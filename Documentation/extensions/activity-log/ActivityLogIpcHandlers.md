# ActivityLogIpcHandlers

`extensions/activity-log/ActivityLogIpcHandlers.js`

IPC controller for the Activity Log settings tab; every channel passes
through to the ActivityLogService. Channels are prefixed `ext.activity-log.`.

## Methods

- `ActivityLogIpcHandlers.register(ipc, service)`:
  - `getSettings` -> the settings; `getCallers` -> `getKnownCallers()`; `count` -> the row count (raw, not enveloped).
  - `setSettings(patch)` -> `{ success: true, settings }`.
  - `getEntries(filter)` -> `{ success: true, entries, total }`.
  - `getEntry(id)` -> `{ success: true, entry }`.
  - `getByCorrelation(correlation)` -> `{ success: true, entries }`.
  - `clear` -> `{ success: true }`.
  - On a throw: `{ success: false, error }` plus the fallback fields the tab
    reads (`entries: [], total: 0`; `entry: null`; `entries: []`).

## Why not IpcEnvelope

`IpcEnvelope.enveloped` has no fallback-fields option yet (an open change
request); the renderer reads `entries` and `total` on failure too.
