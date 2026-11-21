# HubContext

`extensions/personal-hub/HubContext.js`

The Hub's four Dashboard widgets as text for the chat's `@dashboard`
([DashboardSnapshot](../../core/dashboard/DashboardSnapshot.md)): compact
markdown lines the model can read at a glance, each section ending with the
`hub_*` tool that fetches more. Reached through
[HubService](HubService.md)`.widgetContext`, the method the manifest names as
every widget's `context`.

## Methods (static)

- `render(api, widgetId, { now })` -> `{ title, text }` for `focus`,
  `agenda`, `board` or `inbox`; any other id throws `Unknown Hub widget
  "<id>"`.
- `focus(api, { now })`: title `Focus`, from `getFocus()`
  ([FocusService](focus/FocusService.md)). `### Working on` (the task as a
  board line, or `- Nothing picked.`), `### Needs them (<n>)` with one line
  per need (a task or an item `- [id] Overdue: Title (where)`, a context
  `- Acme: who is waiting and for what`; `- Nothing right now.` when empty,
  `- ...and N more` past the cap), then `### Calendar` (`- Now: Title (until
  HH:MM)`, `- Next: Title at HH:MM`, with `tomorrow` when it is not today,
  or `- Nothing coming up.`).
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
  error): description` (the description on one line, 200 characters).
  Assignees are named by `_assigneeNames`: a tracker keeps them as `{ id,
  name }` objects, so each reads as its name, else its email, else its id,
  and a plain string from an older row reads as it is. A past
  due date in the done column is history, so it is not marked `overdue`. Hidden
  tasks are only counted (`1 finished task hidden from the board ...`). At
  most 60 tasks per lane.
- `activity(api, { now })`: title `Activity`. Opens with `ACTIVITY_NOTE` (what
  reached the user recently, background about their day and not a to-do list:
  nothing is unread or waiting to be cleared), then the `_byContext` block
  when `listSummaries()` has cards: `### By context (<n>)` with one line per
  summary card, `- Acme (4 items): headline. summary. Needs them:
  <reason>.` (the last part only when the card says someone is waiting), so
  the model reads the distilled view before the item list. Then
  `_whoIsWho(items)`: `### Who is who (<n>)`, one line per contact named
  in the items' `people`, each contact once: `- Name (person; Acme; 48
  notifications on slack, gmail): about`, where the bits in brackets are
  `person` for a contact marked as one, the context it belongs to
  (`homeContextName`) and how often and through which apps it has written,
  and the text after the colon is what is recorded, or `nothing recorded`.
  A contact is listed when anything is known about it (`about`, kind
  `person`, a context) or when it has sent `FREQUENT_NOTIFICATIONS` = 10
  or more notifications (`_worthNaming`). At most `MAX_PEOPLE` = 40 lines,
  then `- ...and N more`; the block is left out when there is nobody to
  name. Then the active items of the
  last `ACTIVITY_DAYS` = 7 days, newest activity first
  (`listThreads({ state: 'active', since, limit: 60 })`, `since` being local
  midnight six days back): `### Today (<n>)` (`- Nothing yet today.` when
  empty) and, only when there are any, `### Earlier this week (<n>)`. Each
  item reads `- [thr_id] app: Title with participants (chat; 30 min ago;
  urgent; 3 notifications; labels ...; on the board as task_id): summary or
  last notification`; the kind comes first and is left out when it is
  `other`. Then `### Notifications today (<n>)`: the raw log since local
  midnight (`listNotifications({ since, limit: 121 })`), newest first,
  `- HH:MM app: sender: body`, at most 120 (then the count reads `120+`).
  The closing `More:` hint is `ACTIVITY_MORE`: `hub_get_thread` first (every
  message behind an item, to read before saying who someone is or what they
  want, because an item line shows only its last message), then
  `hub_list_contacts` (what is recorded about a person and everywhere they
  appear), `hub_list_threads` and `hub_list_notifications`.

## Why

The widgets are what the user looks at, so the chat should see the same
facts: the focus view (what they are doing and the little that needs
them), the agenda beyond today (so "what is my week" needs no tool call), the
board with the tracker statuses the user has not sorted yet, and the day's
notification log (older days are a `hub_list_notifications` call away, which
is why that tool exists). The activity section says in so many words that it
is background, so the model does not report its items as unread or pending.
Who is who comes before the items so the model knows who a participant is
to the user (an ex-wife, a landlord, the bank) when it reads them. It names
people with nothing recorded too: a model asked "who is Casey" once saw a
person the user had filed under a company and who had written 48 times, yet
the block skipped them for having no description, the hint sent the model
to the empty contact record, and it guessed from one message. So the line
says what little is known and that nothing is recorded, and the hint points
at the messages themselves.
Ids are included so the model can act with `hub_get_task`, `hub_move_task`,
`hub_thread_to_task` and friends.
