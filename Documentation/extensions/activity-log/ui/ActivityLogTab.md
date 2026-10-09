# ActivityLogTab

`extensions/activity-log/ui/ActivityLogTab.js`

The Activity Log settings tab in the main window: master enable, retention
(days and max entries), per-caller toggles and a list-plus-detail log viewer.
Settings save automatically.

## Methods

- `activate(context)`: registers the `settings-tab` slot (`activity-log`,
  label `Activity Log`, `onShow` on tab activation) through
  `context.slotManager` with [ActivityLogMarkup](ActivityLogMarkup.md), builds
  [CallerListView](CallerListView.md), [EntryListView](EntryListView.md) and
  [EntryDetailView](EntryDetailView.md), and binds the controls. Logs
  `activity-log: failed to register settings tab` when no container comes back.
- `deactivate()`: clears the timers and drops the container and lists.
- `onShow()`: `loadSettings`, `loadCallers`, `loadEntries` in order.
- `loadSettings()`: `getSettings`; on a throw, the defaults (off, 7 days,
  10000 rows). Filling the fields never triggers a save.
- `loadCallers()`: `getCallers` (empty on a throw), renders the toggle list
  and the caller filter.
- `saveSettings()`: sends `{ enabled, retentionDays, retentionMaxRows }`
  (non-numbers become 0); on success re-renders the callers and flashes
  `Saved.`, else `Save failed: <error>`.
- `loadEntries()`: `getEntries({ caller, result, search, limit: 200 })`
  from the filters (empty values sent as undefined).
- `selectEntry(id)`: highlights the row, shows `Loading...`, then the detail
  from `getEntry(id)` or `Failed to load entry.`.

Behaviour: the master switch and number fields save on change, the number
fields also 500 ms after typing stops. A caller switch sends
`setSettings({ enabledCallers: { [caller]: value } })` and flips back on
failure. The search box reloads 200 ms after typing; the selects at once.
`Clear all logs` asks `Clear all activity log entries? This cannot be undone.`
through `Dialogs.confirm`. Status messages revert to
`Changes save automatically.` after 3.5 s.

## IPC

`ext.activity-log.getSettings`, `setSettings(patch)`, `getCallers`,
`getEntries(filter)`, `getEntry(id)`, `clear`
(see [ActivityLogExtension](../ActivityLogExtension.md)).

## Globals

Reads `window.LumaModal` (through Dialogs). The entry `renderer.js` writes
`window.__ext_activity_log` (`{ activate, deactivate }`), the shell's extension
renderer contract.
