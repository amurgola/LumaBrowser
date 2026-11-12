# FocusService

`extensions/personal-hub/focus/FocusService.js`

The one distilled answer to "what am I doing and what needs me": the task
the user said they are working on, a short list of what needs them (tasks
that are overdue or due today, contexts whose activity summary says someone
is waiting, and single items marked high or urgent), and what the calendar
holds now and next. Everything else in the Hub is ruled out of this view on
purpose. Emits `focus.changed` when the working task changes.

## Methods

- `new FocusService({ board, calendar, summarizer, db, emit?, now? })`:
  `board` a [BoardService](../board/BoardService.md), `calendar` a
  [CalendarService](../calendar/CalendarService.md), `summarizer` an
  [ActivitySummarizer](../summary/ActivitySummarizer.md), `db` the
  extension's DatabaseService (the setting `focus.taskId`).
- `get()` -> `{ now, needs, more, calendar: { current, next } }`:
  - `now`: the working task, or `null`. A task that was finished (moved to a
    done column), hidden or archived since is no longer the working task.
  - `needs`: at most `MAX_NEEDS` = 5 lines, the rest counted in `more`.
    Tasks come first: open tasks with a due date before the end of today,
    oldest first, so overdue ones lead (`{ kind: 'task', id, taskId, title,
    url, reason: 'Overdue' | 'Due today', where }`, `where` being the source
    and list; the working task is left out). Then, per summary card: a card
    that says someone is waiting is one line (`{ kind: 'context', id,
    contextId, title, color, headline, reason, threadIds, asks }`, `title`
    the context's name, `reason` the card's reason or headline); in a card
    that does not, each item marked high or urgent is a line of its own
    (`{ kind: 'item', id, threadId, title, reason: 'Marked <priority>',
    where, url, taskId }`, `where` the card's name).
  - `calendar`: the timed event in progress and the next one to start within
    the two-day window (`listEvents({ days: 2 })`); cancelled and all-day
    events are left out. Each is `{ id, title, startsAt, endsAt, location,
    url, sourceLabel }` or `null`. A calendar read that throws gives both
    `null`.
- `setTask(taskId)`: sets the working task, or clears it with a falsy id;
  throws `Task not found.` for an unknown or archived task. Returns `get()`.

## Events

`focus.changed` `{ taskId }` (`null` when cleared).

## Why

The board, agenda and activity widgets each show everything of their kind.
This view is the opposite: it starts from nothing and admits only what the
Hub could not rule out, capped at five lines, so a glance says whether to
keep working or switch.
