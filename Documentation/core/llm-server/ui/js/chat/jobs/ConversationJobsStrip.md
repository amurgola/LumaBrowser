# ConversationJobsStrip

`core/llm-server/ui/js/chat/jobs/ConversationJobsStrip.js`

The strip above the composer for the open conversation's running background jobs, a
[ComposerStrip](../composer/ComposerStrip.md) (order 10, above the plan panel and the
queued messages).

## Methods

- `attach(bar)`, `paint()`, `unmount()`: from the base.
- `refresh()`: reads `api.convJobs.list(activeId)`. A host without `convJobs` has none.
- `onEvent(ev)`: `changed` adds or updates a row, `finished` removes it, `posted` asks
  [ConversationView](../conversation/ConversationView.md) `showPosted()`. Events of other
  conversations are ignored.
- `reset()`: on leaving a conversation.

The jobs are a LoRA training run or a tool call the model put in the background
([BackgroundTasks](../../../../chat/tasks/BackgroundTasks.md)), under a head line that
counts them ("2 tasks running"). The chevron folds the rows away, leaving the head line
with the first task and what it is doing; the choice is kept for the session, across
conversations. Cancel calls `api.convJobs.cancel(id)` and marks the row "stopping" until
the job reports its end. Markup comes from [ConversationJobsHtml](ConversationJobsHtml.md);
styles are the `.cm-job-*` rules in `chat.css`.
