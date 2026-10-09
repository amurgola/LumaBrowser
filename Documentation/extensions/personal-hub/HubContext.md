# HubContext

`extensions/personal-hub/HubContext.js`

The Hub's three Dashboard widgets as text for the chat's `@dashboard`
([DashboardSnapshot](../../core/dashboard/DashboardSnapshot.md)): compact
markdown lines the model can read at a glance, each section ending with the
`hub_*` tool that fetches more. Reached through
[HubService](HubService.md)`.widgetContext`, the method the manifest names as
every widget's `context`.

## Methods (static)

- `render(api, widgetId, { now })` -> `{ title, text }` for `agenda`, `board`
  or `inbox`; any other id throws `Unknown Hub widget "<id>"`.
- `agenda(api, { now })`: `listEvents({ days: 7 })` grouped by local day
  (`### Today, Friday, October 9`, `### Tomorrow, ...`, then the weekday and
  date), all-day events first, each `- HH:MM-HH:MM: Title (location /
  source / organizer / status) [ended]`. An empty week reads `No calendars
  are connected yet.` (no sources) or `Nothing on the calendar for the next 7
  days.`. At most 150 events.
- `board(api, { now })`: `listTasks({ includeHidden: true })` minus archived
  tasks, one `### <column> (<n>)` lane per column in order, then one lane per
  tracker status with no column yet (`### in review (tracker status with no
  column yet) (1)`), each task `- [task_id] Title (priority; due today |
  2026-10-08, overdue; source > space > list; assigned ...; tags ...; sync
  error): description` (the description on one line, 200 characters). Hidden
  tasks are only counted (`1 finished task hidden from the board ...`). At
  most 60 tasks per lane.
- `queue(api, { now })`: `### Open threads (<n>)`, newest activity first
  (`listThreads({ state: 'open', limit: 60 })`), each `- [thr_id] app: Title
  with participants (30 min ago; urgent; 3 notifications; labels ...; on the
  board as task_id): summary or last notification`; then `### Notifications
  today (<n>)`: the raw log since local midnight
  (`listNotifications({ since, limit: 121 })`), newest first, `- HH:MM app:
  sender: body`, at most 120 (then the count reads `120+`).

## Why

The widgets are what the user looks at, so the chat should see the same
facts: the agenda beyond today (so "what is my week" needs no tool call), the
board with the tracker statuses the user has not sorted yet, and the day's
notification log (older days are a `hub_list_notifications` call away, which
is why that tool exists). Ids are included so the model can act with
`hub_get_task`, `hub_move_task`, `hub_set_thread_state` and friends.
