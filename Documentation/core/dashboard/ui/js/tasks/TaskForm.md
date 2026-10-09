# TaskForm

`core/dashboard/ui/js/tasks/TaskForm.js`

The "New scheduled update" form.

## Methods

- `new TaskForm(api, doc, rootId, onCreated)`, `build()`: name, prompt, interval
  (`INTERVALS`: 15, 30 (default), 60, 360, 1440 minutes, or Custom…). Schedule
  requires a prompt (focuses it otherwise) and creates
  `{ rootId, title (default "Scheduled update"), prompt, intervalMs }`.
- `TaskForm.minutesFrom(selectValue, customValue)`: custom minutes default to
  45 and never go below 5.
