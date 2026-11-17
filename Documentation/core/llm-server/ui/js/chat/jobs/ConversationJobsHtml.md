# ConversationJobsHtml

`core/llm-server/ui/js/chat/jobs/ConversationJobsHtml.js`

Markup builder for the background-jobs strip.

## Methods

- `build(jobs, stopping)`: one `.cm-job` row per job.
- `line(job, isStopping)`: `training · step 240 of 800 · about 11:54 left`, or
  `stopping…` once Cancel was pressed.
- `percent(job)`: 0 to 100 when the job counts steps, else null (no bar).

All text is escaped. A job that cannot be cancelled has no button.
