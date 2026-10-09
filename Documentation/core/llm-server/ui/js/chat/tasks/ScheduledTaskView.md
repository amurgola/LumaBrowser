# ScheduledTaskView

`core/llm-server/ui/js/chat/tasks/ScheduledTaskView.js`

A scheduled task's runs view in the main pane: schedule facts, the instructions,
Run now (a refusal shows on the button for 2.5 s), Pause/Resume, Edit in chat,
and the run history newest first with the newest expanded. Desktop only (the web
shim has no `schedTasks`); a task deleted underneath falls back to the landing.

## Methods

- `open(taskId)`.
- `ScheduledTaskView.enterRunsView(ctx, leaveMode?)`: clears everything
  conversation-scoped (shared with the trigger view).
- `ScheduledTaskView.runRowHtml(run, kindChipHtml, { before, after })`: one run
  row (shared with the trigger view).
