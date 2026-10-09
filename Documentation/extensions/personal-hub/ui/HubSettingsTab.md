# HubSettingsTab

`extensions/personal-hub/ui/HubSettingsTab.js`

The Hub settings tab: composes the sync summary, connections, calendars, task trackers,
board columns and automation sections into one page (ids prefixed
`ext-hub-`), loads them on activation and on every tab show, and reloads on
the main process's change events.

## Methods

- `activate(context)`: registers the `settings-tab` slot (`personal-hub`,
  label `Hub`, tabId `personal-hub`, `placement: 'tab'` so the Hub is a
  top-level Settings tab rather than a Configure page under Extensions,
  reloading on tab activation) through `context.slotManager`, binds every section to the container, subscribes to
  `ext.personal-hub.changed` through `ipcBridge.on` when the bridge has it,
  then `reloadAll()`s.
- `deactivate()`: detaches the subscription, unbinds the sections, clears the
  notice timer.
- `invoke(channel, ...args)`: `ext.personal-hub.<channel>` over the IPC bridge.
- `reloadAll()`: loads every section in parallel (one failing section reports
  on the notice line and never blocks the others), then hands the loaded
  columns to the task-tracker section for its status map.
- `notify(message, ok)`: the notice line under the title, green or red,
  cleared after 6 s.
- `html()`: the composed markup.

Sections: [SyncStatusSection](settings/SyncStatusSection.md),
[ConnectionsSection](settings/ConnectionsSection.md),
[CalendarSourcesSection](settings/CalendarSourcesSection.md),
[TaskSourcesSection](settings/TaskSourcesSection.md),
[BoardColumnsSection](settings/BoardColumnsSection.md),
[AutomationSection](settings/AutomationSection.md). Saving columns refreshes
the task section's status map; the automation info hands the OAuth callback
URL to the calendar section.

`RELOAD_EVENTS` (`sync.status`, `calendar.changed`, `calendar.synced`,
`board.changed`, `task.changed`) are the change-event types that reload the
tab; others (thread events) are ignored here.

## IPC

See each section; all under `ext.personal-hub.`. Replies are
`{ success, ...payload }` or `{ success: false, error }`.

## Globals

Reads `window.LumaModal` through Dialogs (in the sections).
