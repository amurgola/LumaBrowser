# ConversationJobsStrip

`core/llm-server/ui/js/chat/jobs/ConversationJobsStrip.js`

The strip above the composer for the open conversation's running background jobs.

## Methods

- `attach(bar)`: called on every conversation render; the composer bar is rebuilt each
  time, so the strip is put back with what it already knows.
- `refresh()`: reads `api.convJobs.list(activeId)`. A host without `convJobs` has none.
- `onEvent(ev)`: `changed` adds or updates a row, `finished` removes it, `posted` asks
  [ConversationView](../conversation/ConversationView.md) `showPosted()`. Events of other
  conversations are ignored.
- `reset()`: on leaving a conversation.

Cancel calls `api.convJobs.cancel(id)` and marks the row "stopping" until the job
reports its end. Markup comes from [ConversationJobsHtml](ConversationJobsHtml.md);
styles are the `.cm-job-*` rules in `chat.css`.
