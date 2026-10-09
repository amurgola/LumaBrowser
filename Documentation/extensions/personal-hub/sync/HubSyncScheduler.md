# HubSyncScheduler

`extensions/personal-hub/sync/HubSyncScheduler.js`

The Hub's single master tick: every 30 seconds it syncs the calendar and task
sources that are due, one at a time, and answers "sync now" requests. Syncs
never overlap; a tick that finds one running is dropped.

## Methods

- `new HubSyncScheduler({ calendarSources, taskSources, calendar, board, emit?, now? })`:
  the two source repositories (`due`, `get`, `list`) and the two services whose
  `syncSource(source)` performs one sync.
- `start()` / `stop()`: the interval plus a 5 second catch-up tick after boot;
  timers are unref'd.
- `tick()`: every due, enabled source in turn; `[]` when nothing is due,
  `null` when a sync is already running.
- `syncNow({ kind = 'all' | 'calendar' | 'tasks', sourceId? })`:
  `{ success, results }`, or `{ success: false, error }` while busy or for an
  unknown source id.
- `status()`: `{ running, lastRunAt, lastResults, calendars, tasks }`.

Each result is `{ kind, sourceId, status: 'ok' | 'error', count?, error? }`.
A service that throws is reported as an error and the other sources still run.
`sync.status` is emitted when a run starts (`{ running: true }`) and ends
(`{ running: false, results }`).

## Why not IntervalTaskScheduler

Core's interval schedulers run background agent turns on a model slot; a sync
is plain HTTP and must not wait for the chat to be idle, so the Hub keeps a
small scheduler of its own, as Timed Tasks does.
