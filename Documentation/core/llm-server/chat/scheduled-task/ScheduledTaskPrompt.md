# ScheduledTaskPrompt

`core/llm-server/chat/scheduled-task/ScheduledTaskPrompt.js`

The system prompt of a [ScheduledTaskMode](../ScheduledTaskMode.md) setup turn.

## Methods

- `ScheduledTaskPrompt.build(task, toolGroups = null)` returns the
  `<scheduled_task_mode>` block: the four setup steps (clarify, frequency in
  the [TaskInterval](TaskInterval.md) range, confirm, then
  `create_scheduled_task`), the setup-form exception, how to write a
  self-contained run prompt, a `<run_tools>` block when `toolGroups` is an
  array, the model/gear-panel note, and, when `task` is given, the
  "ALREADY EXISTS" section with the task as JSON (`title`, `prompt`,
  `frequency`, `everyMinutes`, `enabled`, `lastRunAt`, `lastStatus`, `nextRunAt`).
- `ScheduledTaskPrompt.toolListLines(groups)`: a group whose tools have no
  descriptions collapses to `- <label>: a, b`; otherwise one
  `  - <name>: <description>` line per tool, whitespace-flattened and cut to
  `TOOL_DESC_CHARS` (220) with an ellipsis. Empty groups are skipped.

## Why

The runs have no memory of the setup chat, so the prompt pushes the model to
write fully self-contained instructions that name real tools; listing the
live run tools stops it asking the user for credentials a tool already carries.
