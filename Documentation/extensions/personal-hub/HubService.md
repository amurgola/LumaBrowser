# HubService

`extensions/personal-hub/HubService.js`

The Hub's one public API: a facade over the calendar, inbox (the activity
feed), board, sync, context, summary, focus and contact services and the
conversation reader. The IPC handlers, REST routes, `hub_*` tools, Dashboard widgets and
live modules all call these methods, so their names are the contract
(`manifest.dashboard.api` lists the ones exposed to the Dashboard and modules).

## Methods

- `new HubService({ calendar, inbox, board, sync, inbound, openUrl, connections?, contexts?, summarizer?, focus?, contacts?, reader?, now? })`:
  `connections` is `{ monitor, accounts, tabs }`; `contexts` a
  [ContextService](context/ContextService.md), `summarizer` an
  [ActivitySummarizer](summary/ActivitySummarizer.md), `focus` a
  [FocusService](focus/FocusService.md), `contacts` a
  [ContactService](contacts/ContactService.md), `reader` a
  [ConversationReader](snapshot/ConversationReader.md) (each optional:
  without one its reads answer empty and its writes throw); `now()` returns
  a Date (for the chat context).
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
- Activity feed (notifications rolled up into items; context about the user's
  day, not a queue): `ingestNotification(notification, tab)`,
  `listThreads({ state, app, since, limit, offset })` (`state` is `active` by
  default, everything not dismissed; `done` lists the dismissed items, `all`
  every one; `since` is an ISO time; each item carries its `kind`, its
  `contextId` (the context it is filed under by
  `ContextService.forItem`, or `null`) and `lastNotification`, newest
  activity first), `getThread(id)`,
  `setThreadState(id, state, { snoozeUntil })` (`done` dismisses an item from
  the feed, `open` restores it; `reviewed` and `snoozed` are still accepted),
  `setThreadsState(ids, state)` (the same for several items at once, a whole
  summary card dismissed or put back; returns the number changed),
  `enrichThread(ref, enrichment)`, `pushQueueItem(item)`,
  `linkThreadToTask(threadId, taskId)`,
  `listNotifications({ limit, offset, app, since })` (see [InboxService](inbox/InboxService.md)).
- `async threadToTask(threadId, { columnKey?, sourceId?, listId?, status? })`
  -> `{ task, thread, created }`: makes a board task from a feed item and
  links the two in one step. The title is the item's title (else the last
  notification's title, the participants, or `Follow up`), the description its
  summary or last notification body followed by its url. An item already
  linked to a task that is not archived answers that task with
  `created: false`, and a second call for the same item while the first is
  still creating joins it, so a retry or a double click never makes two tasks.
  The options are those of `createTask`; a tracker column with no linked
  status answers `{ needsStatus, statuses, column }` and creates nothing.
  Throws `Activity item not found.` for an unknown id. Once the task exists,
  `_attachConversation` reads the conversation behind the item
  (`snapshotThread`) and, when there is text, appends `Conversation when
  this became a task:` and the text to the task's description, so the task
  carries what is needed to answer. This runs after the reply: it never
  holds the task up and a failed read never fails it. It does nothing
  without a reader or a browser.
- Conversation snapshots: `async snapshotThread(threadId, { force? })` ->
  `{ snapshot: { text, scope: 'conversation' | 'tab', url, takenAt,
  fresh } }` or `{ snapshot: null, reason }`: reads the conversation behind
  a feed item from the user's own signed-in tab and keeps it
  ([ConversationReader](snapshot/ConversationReader.md)`.read`). A snapshot
  of the item's latest activity is reused unless `force`. The reasons here
  are `Snapshots are not available.` (no reader) and `Activity item not
  found.`; the reader adds its own. The item is built by `_feedItem`: one
  feed item as `listThreads` gives it, with its `lastNotification` (title,
  body, time, sender, partition, host, url) and `contextId`.
- People: `listContacts({ query?, limit? })` -> `{ contacts, suggestions }`
  (who the Hub has seen, each with its identities, and the pairs that may
  be one person; both empty without the contact service),
  `mergeContacts(intoId, fromId)`, `splitContactIdentity(identityId)`,
  `renameContact(id, name)` (each answers the contact) and
  `keepContactsApart(aId, bId)` (the user said two suggested contacts are
  different people). The four writes throw `Contacts are not available.`
  without the service. See [ContactService](contacts/ContactService.md).
- Contexts (the companies or areas everything is filed under):
  `listContexts()` -> `[{ id, name, color, sortOrder, rules: [{ kind,
  value }] }]` (empty without a context service), `saveContexts(contexts)`
  (replaces the set, then schedules the summariser at once so the cards are
  grouped again; throws `Contexts are not available.` without the service).
  See [ContextService](context/ContextService.md).
- Activity summaries (the distilled feed): `listSummaries()` -> `{ cards,
  status }` (one card per context with recent activity; see
  [ActivitySummarizer](summary/ActivitySummarizer.md)`.cards` and `.status`),
  `summaryStatus()`, `setSummariesEnabled(enabled)` -> the status,
  `summaryModels()` -> `{ models: [{ value, label }], chosen }` (the models
  the summariser can use and the one it uses now),
  `setSummaryModel(value)` -> the status (`''` chooses the app's active
  provider),
  `async summarizeNow({ force? })` -> `{ written, failed, skipped }` (writes
  the cards whose items changed, every card with `force`). Without a
  summariser the reads answer no cards, `{ enabled: false, available:
  false }` and `{ models: [], chosen: '' }`, and the writes throw
  `Summaries are not available.`.
- Focus (what the user is doing and the little that needs them):
  `getFocus()` -> `{ now, needs, more, calendar: { current, next } }`,
  `setFocusTask(taskId)` (a falsy id clears it; throws `Focus is not
  available.` without the service). See [FocusService](focus/FocusService.md).
- Task board: `listColumns()`, `saveColumns(columns)`, `listTasks(query)`
  (`includeHidden` adds hidden tasks), `getTask(id)`, `createTask(input)`
  (async; `{ title, columnKey?, description?, sourceId?, listId?, status? }`,
  with `sourceId` the task is created in that tracker too, or the reply is
  `{ needsStatus, statuses, column }` when a status must be picked first),
  `listTaskTargets()`
  (where a new task can go: each connected source with its lists),
  `setTasksHidden(ids, hidden)` (`hidden` defaults to true; only `false`
  shows), `updateTask(id, patch)`,
  `moveTask(id, columnKey, { beforeId?, sortOrder?, status? })` (`beforeId`
  places it before that task in the column, `null` at the end, and a move
  within its own column only reorders; a remote task with no
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
  of one Dashboard widget (`focus`, `agenda`, `board`, `inbox`) for the chat's
  `@dashboard` ([HubContext](HubContext.md)); the manifest names this method as
  every widget's `context`, so the host calls it without it being in
  `dashboard.api`. Throws on an unknown widget.
- `openUrl(url)`: opens a real tab through the browser service when available.

## Why a facade

Four surfaces consume the same operations. One class with plain-data returns
keeps the IPC controller, the routes and the tool handlers to routing only,
and gives the Dashboard allow-list one set of names to check against.
