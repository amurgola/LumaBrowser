# HubInboxWidget

`extensions/personal-hub/ui/widgets/HubInboxWidget.js`

The Hub's activity widget (`manifest.dashboard.widgets` id `inbox`, titled
`Activity`), in two views. Summary, the default, is the distilled one: a
card per context (a company or area of the user's life) saying what is going
on and whether anyone is waiting on them, written by the summariser
([ActivitySummarizer](../../summary/ActivitySummarizer.md)) and updated card
by card as activity arrives. Detail is the running feed of what reached the
user (chat messages, mail, calendar and task notices, anything a site or an
automation raised), rolled up per conversation or subject and grouped by
day, newest first. Either way it is context about the day, not a queue:
nothing is counted as unread and nothing needs clearing. An item can be
opened, read (the conversation behind it, fetched from its signed-in tab and
shown under the row), turned into a board task, or dismissed from the feed
(with undo, and a toggle that shows the dismissed ones so they can be
restored). Extends
[HubWidgetBase](HubWidgetBase.md); reloads on `thread.changed`,
`summary.changed` and `context.changed`, and every minute (`TICK_MS` =
60000).

## Views

- The head carries a `Summary` / `Detail` switch (`.hub-mode`, a tablist
  with `aria-selected`). The choice is kept in localStorage
  `hub.activity.mode`; anything but `detail` there means Summary. Switching
  closes an open task form and reloads.
- At the end of the head, in both views, a gear button
  ([HubSettingsPanel](HubSettingsPanel.md)`.button(host, 'summary')`) opens
  the Hub's settings panel on Summaries.
- Someone working across many companies wants to know what is going on per
  company before reading single notifications, which is why Summary comes
  first and Detail is one click away.

## Summary view

- Loads `listSummaries()` -> `{ cards, status }`. The app chips and the
  `Dismissed` toggle are not shown in this view.
- With summaries switched off, a note sits above the cards
  (`.hub-sum-note`): `These cards are filled in by rules.` followed by the
  link button `Have a model write them` (`.hub-link.hub-sum-setup`), which
  opens the settings panel on Summaries (`HubSettingsPanel.open(host,
  'summary', doc)`), where summaries are switched on and the model picked.
- One card per context with recent activity (`.hub-sum-card`, `data-card`;
  `needs-you` adds an amber edge): the context's colour swatch and name, the
  item count, the time of its newest activity, the headline, the summary
  (when it says more than the headline), and when someone is waiting a `May
  need you` chip with the reason.
- `updating` (`.hub-sum-updating`) shows while summaries are on, a model is
  set and the card is about to be written again: its items changed since
  its text was written (`stale`), or it is still a rule card with no error.
- Asks (`.hub-sum-ask`): what the card says is being asked of the user, each
  with `To task` (`threadToTask(threadId, {})`, one step onto the board with
  the defaults), or the mark `On the board` when that item already has a
  task. The summariser only proposes; nothing becomes a task until the user
  clicks.
- A failed attempt shows `Summary not updated: <error>` under the last good
  text.
- `Show items` / `Hide items` opens the card to its items, drawn as the
  Detail rows below with the same actions. Which cards are open is kept for
  the life of the widget.
- `Dismiss` on a card takes all of its items out of the feed in one call,
  `setThreadsState(ids, 'done')`, with the same undo bar (`Dismissed
  "<context name>"`); new activity brings the context back.
- Empty state: `Nothing going on. Activity from your chat, mail, calendar
  and other tabs is summed up here by context.`.

## Detail view

- Loads `listThreads({ state, limit })`: `state` is `active`, or `all` while
  the dismissed toggle is on; `limit` is the page (`PAGE` = 100, grown by
  `Show earlier`) plus one, which is how the feed knows there is something
  earlier. Sorted by `lastAt` descending.
- Head: the title `Activity`, app filter chips when two or more apps are
  present (`All`, then each app's short name; a filter on an app that is gone
  falls back to `All`), and the `Dismissed` toggle (`.hub-show-dismissed`,
  `aria-pressed`). There is no count.
- The list is grouped under day headings (`.hub-feed-day`:
  [WidgetDom](WidgetDom.md)`.dayLabel`, so `Today`, `Yesterday`, then the
  date; `Undated` without a time), with a `Show earlier` button
  (`.hub-show-earlier`) at the end while there is more.
- Rows (`.hub-thread`, `data-thread`, `data-kind`; `is-dismissed` when the
  state is `done`): an app tag (`APPS`: slack, teams, gmail, outlook,
  messages, clickup, proton, discord, whatsapp, telegram; the tag is neutral
  and the app's colour, passed as the `--hub-app` custom property, shows as a
  small dot; unknown apps get their name on a grey dot) whose tooltip is the
  kind (`KINDS`: Chat, Mail, Calendar, Task, Notification), the title
  (participants, then `(untitled)` as fallbacks), a priority chip only for
  `high` and `urgent`, a plain count when more than one notification, the
  time (a clock time today, `5 min ago` style for earlier days, the full date
  as tooltip), the participants line, and the summary or the last
  notification's body or title (two-line clamp).
- Actions are quiet text buttons (`.hub-row-action`) that show with the row
  under the pointer: `Open` (when the item has a url, through
  `host.openTab`), `Read` (or `Hide` once it was read), `To task` (or the
  mark `On the board` when the item is already linked), and `Dismiss`, or
  `Restore` on a dismissed row.
- Read: `snapshotThread(id, {})` asks the Hub to read the conversation
  behind the item from its signed-in tab, without opening it
  ([ConversationReader](../../snapshot/ConversationReader.md)). While it
  runs the row shows `Reading the conversation...`. The text then shows
  under the row (`.hub-snapshot`, scrolling past 220px) beneath a line
  saying where it was read from and when: `Read from the conversation` (the
  item's own address was opened in a hidden tab) or `Read from what its tab
  is showing` (the user's tab was read where it stood), then the relative
  time. When nothing was read the row shows a note instead
  (`.hub-snapshot.is-note`): the reason the Hub gave (the tab is showing
  something else, no signed-in tab is open), the error of a failed call, or
  `There was nothing more to read.`. `Hide` removes the text or the note.
  What is shown is kept per item in `_snapshots` (`{ loading }`, `{ text,
  scope, takenAt }` or `{ note }`) for the life of the widget, in both
  views; a reply that arrives after `Hide` is dropped.
- Dismiss: `setThreadState(id, 'done', {})`. The last dismissal stays
  undoable for `UNDO_MS` = 12 s in the `.hub-undo` bar (`Dismissed "<title>"`,
  `Undo`). The undo holds a list of ids, one for a row and every item of a
  dismissed card: Undo calls `setThreadState(id, 'open', {})` for one id and
  `setThreadsState(ids, 'open')` for several. Restore:
  `setThreadState(id, 'open', {})`. New activity brings a dismissed item
  back by itself.
- To task: opens a small form under the row (`.hub-task-form`) with the board
  column, where the task is created (`Local only`, then each tracker list:
  `<label> (ClickUp)` for a single-list source, else `<label> / <list>`),
  `Add task` and `Cancel`. The columns and targets load once
  (`listColumns`, `listTaskTargets`; a failed targets read leaves only
  `Local only`). The place offered first is the one the board's quick-add
  last used (localStorage `hub.board.addTarget`); a remembered place that is
  gone falls back to `Local only`. `Add task` calls
  `threadToTask(threadId, { columnKey?, sourceId?, listId? })`, one call that
  makes the task and links it, so a failure leaves nothing half done and
  trying again cannot double it. A `needsStatus` reply opens the
  [StatusPicker](StatusPicker.md) and calls again with `{ status }`; a
  cancelled pick (`Not added: no ClickUp status was picked.`) or a failure
  shows the error and keeps the form.
- The minute tick reloads (the day may have turned, a snooze set by an
  automation may have run out) unless a task form is open.
- Empty state: `Nothing yet. Notifications from your chat, mail, calendar and
  other tabs show up here as they arrive.`.
- `dispose()` also clears the undo timer and closes the settings panel
  (`HubSettingsPanel.closeCurrent()`) and the picker.

## Host calls

`listSummaries`, `listThreads`, `setThreadState`, `setThreadsState`,
`threadToTask`, `snapshotThread`, `listColumns`, `listTaskTargets`;
`settingsInvoke` through the settings panel.
