# SyncStatusSection

`extensions/personal-hub/ui/settings/SyncStatusSection.js`

The Hub settings tab's sync summary: how many sources are healthy or failing,
whether a sync is running, and the `Sync everything now` button.

## Behaviour

- `load()` calls `syncStatus` -> `{ status: { running, calendars, tasks } }`.
  The dot is red (`bad`) when any source's last status is `error`, green when idle and
  healthy; the button is disabled while running.
- `static text(status)`: `Idle. 3 calendars and 2 trackers, 1 failing.` or
  `Syncing now. ...`.
- The button calls `syncNow { kind: 'all' }`, then reloads the whole tab and
  says `Sync finished.`.

## IPC

`syncStatus`, `syncNow(opts)`.
