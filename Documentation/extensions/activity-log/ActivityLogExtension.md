# ActivityLogExtension

`extensions/activity-log/ActivityLogExtension.js`

Main-process side of the Activity Log extension: exposes the core
[ActivityLogService](../../core/activity-log/ActivityLogService.md) to its
settings tab. The service itself is created by core before any extension
loads, so every extension's `context.logger` is bound to it.

## Methods

- `activate(context)`: takes `context.sharedServices.activityLog` (throws
  `activity-log: core activityLog service not available, cannot activate`
  without it), registers [ActivityLogIpcHandlers](ActivityLogIpcHandlers.md)
  on `context.ipc`, resolves `{ getService() }`.
- `deactivate()`: drops the service (`getService()` then returns null).

## Entry files

- `manifest.js`: id `activity-log`, requires `core:database`, settings tab
  `activity-log`, `renderer.js`.
- `main.js`: `{ activate, deactivate }` delegating to one instance.
- `renderer.js`: module entry (loaded by the shell as `type="module"`) that sets
  `window.__ext_activity_log` over [ui/ActivityLogTab](ui/ActivityLogTab.md).
