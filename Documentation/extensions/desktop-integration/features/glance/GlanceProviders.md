# GlanceProviders

`extensions/desktop-integration/features/glance/GlanceProviders.js`

The [glance](index.md)'s pluggable sources, in line order (`ALL`). Each is
`{ id, label, setting, extension, collect({ api, now, timeFormat }) }` and
resolves `{ segment: { pre?, title?, post? }, line, items, tooltip: [string] }`
or null. A provider with nothing to show returns its `items` with no segment.

| id | extension | reads | segment |
| --- | --- | --- | --- |
| `calendar` | personal-hub | `listEvents({ days: 2 })`: timed, not cancelled events; the one in progress, else the next within 24 h | `Standup in 12m` (within an hour), `Standup 2:30pm`, `Standup tomorrow 9:00am`, `Standup now` (in progress, until 5 minutes before the next) |
| `queue` | personal-hub | `listThreads({ state: 'open' })` | `4 unread` |
| `tasks` | personal-hub | `listTasks()` minus hidden, archived and done-column tasks (`listColumns()` `isDone`), due before tomorrow | `2 due` |
| `running` | timed-tasks | `getAllTasks()` with `status: 'running'` | `1 running` (steps aside while the jobs feature is on) |
| `jobs` | the jobs feature (`resolve`) | `require('../jobs').summary()` | `42%`, or `2 running` when no job reports progress |

Items: `currentEvent`, `nextEvent`, `unreadCount`, `latestThread`, `dueTasks`
(`{ count, overdue, today, tasks }`), `runningJobs`, `jobs` (`{ running, queued, progress, line }`). Tooltip lines list up to
three threads and three tasks. A provider may give `resolve(deps, lookup)` to supply its api itself (null = unavailable). To add a source, add an object here and a bool
setting in `GlanceService.DEFAULTS` and the feature's `settingsSchema`.
