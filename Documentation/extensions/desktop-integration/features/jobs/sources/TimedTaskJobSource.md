# TimedTaskJobSource

`extensions/desktop-integration/features/jobs/sources/TimedTaskJobSource.js`

Timed-task runs, from the optional `timed-tasks` extension API
(`deps.extensions['timed-tasks']`). The extension marks a task
`status: 'running'` during a run and has no main-process event, so this source
polls `getAllTasks()` every 3 s.

- A running task starts a `timed-task` job ("Timed task: <name>", indeterminate).
- When it stops running, the latest run (`getTaskRuns(id, 1, 0)`) decides:
  `status: 'error'` -> failed with the run's error, else done.
- Not cancellable (the extension has no cancel for a run). A missing or
  throwing extension is treated as no tasks.
