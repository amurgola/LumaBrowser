# HubService

`extensions/personal-hub/HubService.js`

The Hub's one public API: a facade over the calendar, inbox, board and sync
services. The IPC handlers, REST routes, `hub_*` tools, Dashboard widgets and
live modules all call these methods, so their names are the contract
(`manifest.dashboard.api` lists the ones exposed to the Dashboard and modules).

## Methods

- `new HubService({ calendar, inbox, board, sync, inbound, openUrl, connections?, now? })`:
  `connections` is `{ monitor, accounts, tabs }`; `now()` returns a Date (for
  the chat context).
- Calendars: `listCalendarSources()`, `addCalendarSource(input)`,
  `updateCalendarSource(id, patch)`, `removeCalendarSource(id)`,
  `listEvents({ from?, to?, days?, sourceIds? })`, `startOAuth(sourceId)`,
  `completeOAuth(state, code, error)` (see [CalendarService](calendar/CalendarService.md)).
- Connections: `listConnections()`, `checkConnections()`, `showConnectionTab(key)`
  (see [ConnectionMonitor](connections/ConnectionMonitor.md)),
  `openSignInTab('google' | 'microsoft')` (Google Calendar or Teams in a new
  persisted tab of its own), `listAccountCalendars()`, `setAccountCalendar(input)`
  (see [AccountCalendars](connections/AccountCalendars.md)). Without a browser
  they answer empty lists or `{ success: false }`.
- Conversation queue: `ingestNotification(notification, tab)`,
  `listThreads({ state, app, limit, offset })`, `getThread(id)`,
  `setThreadState(id, state, { snoozeUntil })`, `enrichThread(ref, enrichment)`,
  `pushQueueItem(item)`, `linkThreadToTask(threadId, taskId)`,
  `listNotifications({ limit, offset, app, since })` (see [InboxService](inbox/InboxService.md)).
- Task board: `listColumns()`, `saveColumns(columns)`, `listTasks(query)`
  (`includeHidden` adds hidden tasks), `getTask(id)`, `createTask(input)`
  (async; `{ title, columnKey?, description?, sourceId?, listId?, status? }`,
  with `sourceId` the task is created in that tracker too, or the reply is
  `{ needsStatus, statuses, column }` when a status must be picked first),
  `listTaskTargets()`
  (where a new task can go: each connected source with its lists),
  `setTasksHidden(ids, hidden)` (`hidden` defaults to true; only `false`
  shows), `updateTask(id, patch)`,
  `moveTask(id, columnKey, { sortOrder?, status? })` (a remote task with no
  linked status for the column replies `{ moved: false, needsStatus, statuses,
  column }`; pass the picked `status` to move it, which links it),
  `linkStatus(status, columnKey)`, `addStatusColumn(status)`,
  `resetStatusLinks(sourceId)` (link a tracker status to a column, turn it into
  a new column, forget a source's links), `archiveTask(id)`, `listTaskMessages(taskId)`,
  `addTaskMessage(taskId, body, opts)`, `listTaskSources()`, `addTaskSource(input)`,
  `updateTaskSource(id, patch)`, `removeTaskSource(id)`, `discoverTaskSource(input)`
  (see [BoardService](board/BoardService.md)).
- Sync: `syncNow({ kind?, sourceId? })`, `syncStatus()` (see
  [HubSyncScheduler](sync/HubSyncScheduler.md)).
- Inbound: `getInboundToken()`, `rotateInboundToken()` ([InboundToken](InboundToken.md)).
- Chat context: `widgetContext({ widgetId })` -> `{ title, text }`, the text
  of one Dashboard widget (`agenda`, `board`, `inbox`) for the chat's
  `@dashboard` ([HubContext](HubContext.md)); the manifest names this method as
  every widget's `context`, so the host calls it without it being in
  `dashboard.api`. Throws on an unknown widget.
- `openUrl(url)`: opens a real tab through the browser service when available.

## Why a facade

Four surfaces consume the same operations. One class with plain-data returns
keeps the IPC controller, the routes and the tool handlers to routing only,
and gives the Dashboard allow-list one set of names to check against.
