# HubFocusWidget

`extensions/personal-hub/ui/widgets/HubFocusWidget.js`

The Hub's focus widget (`manifest.dashboard.widgets` id `focus`): the one
distilled view. `Now` is the task the user said they are working on, `Needs
you` is the short list the Hub could not rule out (overdue and due-today
tasks, contexts where the activity summary says someone is waiting, items
marked high or urgent), and `Calendar` is what is on now and next.
Everything else stays in the detailed widgets. Extends
[HubWidgetBase](HubWidgetBase.md); reloads on `focus.changed`,
`task.changed`, `board.changed`, `thread.changed`, `summary.changed`,
`context.changed`, `calendar.changed` and `calendar.synced`, and every
minute (`TICK_MS` = 60000), since due dates and the calendar move with the
clock alone.

## Behaviour

- Loads `getFocus()` ([FocusService](../../focus/FocusService.md)`.get`).
- Head: the title `Focus` and a gear button
  ([HubSettingsPanel](HubSettingsPanel.md)`.button(host, 'contexts')`) that
  opens the Hub's settings panel on Contexts, since the contexts decide how
  this view is filed. `dispose()` closes the panel
  (`HubSettingsPanel.closeCurrent()`).
- Now, with a task (`.hub-focus-now`): the title, the source and list and
  the due date, then `Open` (when the task has a url), `Switch` and `Clear`
  (`setFocusTask(null)`). Without one: `Nothing picked. What are you working
  on?` and `Pick a task`.
- The picker (`Pick a task` or `Switch`): a select of the board's open tasks
  grouped by column (done columns and archived tasks left out; loaded from
  `listColumns` and `listTasks({})`), with `Cancel`. Choosing a task calls
  `setFocusTask(id)`. The minute tick leaves an open picker alone.
- Needs you: the heading carries the full count (the shown lines plus
  `more`). Each line (`.hub-need`, `k-task`, `k-context` or `k-item`) is a
  dot, the title, a reason line and quiet actions:
  - a task: `Overdue` or `Due today` with where it lives; `Start` makes it
    the working task. The dot is red when overdue, amber when due today.
  - a context: the summary's reason, the dot in the context's colour;
    `Dismiss` calls `setThreadsState(threadIds, 'done')`, which takes the
    whole card out of the feed until new activity brings it back.
  - an item: `Marked high` or `Marked urgent` with its context; `To task`
    (`threadToTask(threadId, {})`, hidden when it already has a task) and
    `Dismiss` (the same call with the one id).
  - With more than fit: `and N more in the board and Activity`. With none:
    `Nothing needs you right now.`.
- Calendar: the event in progress (`Now, until 10:30`, accented) and the
  next one (`in 25 min` up to an hour ahead, else the clock time, with the
  day when it is not today); the location and source are the tooltip, and a
  row with a url opens it. With neither: `Nothing coming up.`.

## Host calls

`getFocus`, `setFocusTask`, `listColumns`, `listTasks`, `threadToTask`,
`setThreadsState`; `settingsInvoke` through the settings panel.
