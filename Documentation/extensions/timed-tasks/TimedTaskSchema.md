# TimedTaskSchema

`extensions/timed-tasks/TimedTaskSchema.js`

Creates `timed_tasks` and `timed_task_runs` and adds the columns later
releases introduced (`conversation_log`, `status`, `last_status`,
`last_error`), skipping each that already exists.

## Methods

- `TimedTaskSchema.ensure(db)`: `db` is the extension's DatabaseService.
- Statics `TASKS_TABLE`, `RUNS_TABLE`, `ADDED_COLUMNS`.
