# HubBoardWidget

`extensions/personal-hub/ui/widgets/HubBoardWidget.js`

The Hub's task board widget (`manifest.dashboard.widgets` id `board`): one
lane per board column with the tasks from every source, drag and drop between
lanes and to a place within a lane (the card moves at once; a move to another
lane asks which tracker status a column means when it has none linked),
pseudo lanes after the columns for tracker statuses with no column yet, a
quick-add per lane
that can create the task in a connected tracker, source filter chips with
counts, hiding finished tasks (with a toggle to see them), failed syncs marked
on the card and a task detail overlay. Extends [HubWidgetBase](HubWidgetBase.md);
reloads on `task.changed` and `board.changed`, and repaints every minute
(`TICK_MS` = 60000) so due dates turn overdue with the clock. Shared drawing comes from
[TaskChrome](TaskChrome.md).

## Behaviour

- Loads `listColumns()` and `listTasks({ includeHidden: true })` (archived
  tasks dropped); `listTaskTargets()` loads beside them and never holds up the
  paint.
- Head: the title, source chips, the shown-task count and, when the filtered
  tasks include hidden ones, an `N hidden` toggle that shows them dimmed
  (`is-hidden`, dashed). Chips appear only with two or more sources: `All`
  first, then each source by label with `Local` last, each with a colour
  swatch (`TaskChrome.sourceColors`) and its count of tasks not hidden. A
  filter on a source that disappeared falls back to `All`.
- Cards: a left accent in the source's colour, title, the tracker status pill
  in the tracker's own colour, then a meta row with the priority dot,
  `Source / List` (or `Local`), due date (`is-overdue` when past, unless the
  task is hidden or sits in the done lane, where a past date is history), a sync marker and assignee initials. The marker is `sync failed`
  (`.hub-sync-error`, tooltip the error) when `syncError` is set, else
  `sync pending` when `pendingStatus` is set. A hide button (shown on hover, and always on hidden cards) calls
  `setTasksHidden([id], hidden)`.
- Lanes: the head shows the title, the count of tasks not hidden and, on the
  done lane, `Hide all` for every shown task in it.
- Pseudo lanes come after the columns, one per tracker status with no column yet (tasks
  whose `columnKey` starts with `~`), sorted by status: `hub-lane is-pseudo`,
  the head is the status pill and the count, then the note `<sources> status
  with no column yet`, a `Make column` button (`addStatusColumn(status)`) and
  a `Merge into...` select of the columns (`linkStatus(status, columnKey)`).
  They have no quick-add and are not drop targets; their cards can be dragged
  out.
- Drag and drop: the dragged task id is kept on the instance (jsdom and some
  browsers expose no usable `dataTransfer` on drop). Over a lane the landing
  place is marked: `is-drop-before` on the first card whose middle is below
  the pointer, else `is-drop-end` on the lane body; the marks clear when the
  pointer leaves the lane, on drop and when the drag ends. A drop calls
  `moveTask(id, columnKey, { beforeId })` (`beforeId` null for the end of the
  lane), so a drop inside the task's own lane reorders it; a drop on the spot
  the card already holds does nothing. The card moves at once (the loaded
  list is reordered and painted), then the board reloads, so whatever the Hub
  answered, or an error, is painted over it. A `needsStatus` reply opens the
  [StatusPicker](StatusPicker.md) and moves again with `{ beforeId, status }`;
  cancelling puts the card back. A reply with `pushError` shows
  `Moved locally; tracker update failed: ...`.
- Quick-add: Enter in a lane's input calls `createTask({ title, columnKey })`,
  plus `{ sourceId, listId }` for a tracker target. The `Add to` select (shown
  while the add row has focus) offers `Local only`, then each target: one
  option `<label> (ClickUp)` for a single-list source, else an optgroup of its
  lists. Its default is the filtered source (the remembered list when it
  belongs to it, else its first list; `Local only` for the Local filter), else
  the last choice, stored in localStorage `hub.board.addTarget`. A tracker
  create disables the input and shows `Adding to <label>...`; a `needsStatus`
  reply opens the StatusPicker and creates again with `{ status }`. A failure,
  or a cancelled pick (`Not added: no ClickUp status was picked.`), shows the
  error and gives the title back.
- A repaint (a sync landing mid-typing) keeps a half-typed quick-add and its
  focus (input or select), each lane's scroll position and the board's
  sideways scroll. A repaint asked for during a drag waits until the drag
  ends, so the dragged card and its drop targets stay under the pointer.
- Clicking a card opens [HubTaskDetail](HubTaskDetail.md) with `onHide`
  wired to `setTasksHidden`; a sent message schedules a reload.

## Host calls

`listColumns`, `listTasks`, `listTaskTargets`, `createTask`, `moveTask`,
`setTasksHidden`, `linkStatus`, `addStatusColumn`, and through the detail `getTask`, `addTaskMessage`.
