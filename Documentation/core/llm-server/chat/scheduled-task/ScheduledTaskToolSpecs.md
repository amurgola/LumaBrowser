# ScheduledTaskToolSpecs

`core/llm-server/chat/scheduled-task/ScheduledTaskToolSpecs.js`

Names, descriptions and input schemas of the scheduled-task setup tools.

## Methods

- `ScheduledTaskToolSpecs.create()`: `create_scheduled_task`, requires
  `title`, `prompt`, `every_minutes`; optional `run_test` (default true).
- `ScheduledTaskToolSpecs.update()`: `update_scheduled_task`, all optional:
  `title`, `prompt`, `every_minutes`, `enabled`, `run_test` (default false).
- `ScheduledTaskToolSpecs.run()`: `run_scheduled_task`, no parameters.

Each returns `{ name, mutating: true, description, inputSchema }`; the interval
range in the texts comes from [TaskInterval](TaskInterval.md).

## Why

All three are `mutating` so the approval card gates them: a recurring job is a
mutation with a long tail.
