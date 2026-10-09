# TaskRowText

`extensions/timed-tasks/ui/TaskRowText.js`

The words and status dot a timed-task row and the panel header show.

## Methods

- `TaskRowText.dot(task)` -> `{ cls, title }`: `busy` Running now, `''`
  Paused, `bad` Last run failed, `ok` Active.
- `TaskRowText.meta(task)`: `every hour · last 2 h ago · next in 4 min`
  (running: `running now`; never run: `never run`; next only for enabled,
  idle tasks).
- `TaskRowText.count(tasks)`: `No tasks`, `1 task`, `3 tasks, 2 active`.
- `TaskRowText.next(tasks)`: `2 running now`, `Next: <name> in 4 min` (the
  soonest enabled task), `All tasks paused`, or `''`.
- `TaskRowText.settingsSummary(tasks)`: `No tasks yet.` or `3 tasks, 2 active.`
