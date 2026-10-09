# ScheduledTaskTools

`core/llm-server/chat/scheduled-task/ScheduledTaskTools.js`

The three setup tools of [ScheduledTaskMode](../ScheduledTaskMode.md). They
exist only inside the mode's setup turns, never in the runs.

## Methods

- `new ScheduledTaskTools({ taskStore, getScheduler, getChatStore?, emitEvent? })`.
- `build()` returns the tool list: each
  [ScheduledTaskToolSpecs](ScheduledTaskToolSpecs.md) spec plus a `handler(params, ctx)`.
- `create(params, ctx)` (`create_scheduled_task`): needs `ctx.conversationId`
  and a non-blank `prompt`; refuses when the conversation already has a task.
  Creates it with `every_minutes` (default 60) as the interval, renames the
  setup chat to the task title, emits `tasks-changed`, and unless
  `run_test === false` runs `scheduler.runInline(id, { kind: 'test' })`.
  Returns `{ success, task: { id, title, frequency, nextRunAt }, test? }`; with
  no scheduler the test is `{ ran: false, error: 'scheduler not ready; the task will still run on schedule' }`.
- `update(params, ctx)` (`update_scheduled_task`): patches `title`, `prompt`,
  `every_minutes` (non-numeric becomes 0, which the store clamps to the
  minimum) and `enabled`; renames the chat only when the title changed; emits
  `tasks-changed`; tests only when `run_test === true`. Returns
  `{ success, task: { id, title, frequency, enabled, nextRunAt }, test? }`.
- `runNow(params, ctx)` (`run_scheduled_task`): runs the task once with
  `{ kind: 'manual' }` and returns `{ success, task: { id, title }, run }`, or
  `scheduler not ready; try again shortly`.
- Without a task, update and run answer
  `this conversation has no scheduled task yet; use create_scheduled_task`.

Test outcomes are shaped by [TestRunOutcome](TestRunOutcome.md). Renaming is
best-effort: a missing or throwing chat store never fails a tool.

## Why

The sidebar's Scheduled row and the chat that edits it carry one name, hence
the rename. Creating runs a test straight away so the user sees a real outcome
in the same conversation.
