# ScheduledTaskStore

`core/llm-server/chat/ScheduledTaskStore.js`

Chat scheduled tasks (`llm_scheduled_tasks`) and their runs
(`llm_scheduled_task_runs`): recurring background agent runs the user defined
conversationally in the `scheduled-task` chat mode. The owning setup
conversation stays the task's live config surface (each run reads its
`model_ref` and `disabled_tools`). ScheduledTaskScheduler drives execution.
Extends [IntervalTaskStore](IntervalTaskStore.md).

## Declarations

- Owner: `conversationId` (`conversation_id`), the setup chat. Create errors:
  `a scheduled task needs the setup conversationId`,
  `a scheduled task needs a prompt`.
- Interval 5 min .. 7 days, default 1 h. Default title `Scheduled task`.
- Ids `stask_...` and `strun_...`.
- Run extra: `kind` (`scheduled` for a tick, `manual` for Run now, `test` for
  the creation test), default `scheduled`.
- Run outcome: `response`, the model's final message, kept forever after its
  transcript is pruned, capped at 20000 chars. Run pages default to 50.

## Extra methods

- `listWithRunCounts()`: every task with `runCount` (run rows are never
  pruned, so this is the true count). The sidebar list.
- `listByConversation(conversationId)` (oldest first) and
  `getByConversation(conversationId)`: the setup chat's task or `null`; the
  mode keeps it to at most one.
- `runConversationIds(taskId)`: transcript conversations still referenced, for
  the IPC delete and the conversation-delete cascade to remove through
  ChatStore before the rows go.
