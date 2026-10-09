# TaskList

`extensions/timed-tasks/ui/TaskList.js`

The Timed Tasks panel's task rows.

## Methods

- `new TaskList({ listEl, invoke, runList, form, reload })`: `reload()`
  refetches the tasks and calls `render` again; `form` may be null.
- `render(tasks)`: one row per task (status dot, escaped name, Paused badge,
  Run and overflow buttons, [TaskRowText](TaskRowText.md) meta line, last
  error, hidden run-history detail), or the empty state. Reloads the expanded
  task's runs.
- `tick()`: rewrites each row's meta line only.
- `loadRuns(taskId)` / `reopenRuns(taskId)`: load the expanded row's history
  through [TaskRunList](TaskRunList.md); `reopenRuns` first resets to the
  newest page.
- `expandedId` getter.

Clicking a row (outside its actions and detail) expands or collapses its runs.
Run calls `triggerNow` (button reads `Running`), alerts `Run failed: <error>`,
then reloads. The overflow menu ([OverflowMenu](../../ui-kit/ui/OverflowMenu.md))
offers Pause/Resume (`updateTask(id, { enabled })`), Edit (opens the form) and
Delete, which confirms `Delete "<name>" and all of its run history?` (danger)
before `deleteTask`.

## Globals

Reads `window.LumaModal` through Dialogs.
