# ConversationJobsHtml

`core/llm-server/ui/js/chat/jobs/ConversationJobsHtml.js`

Markup builder for the background-jobs strip.

## Methods

- `build(jobs, stopping, { collapsed })`: the head line, then (unless `collapsed`) one
  `.cm-job` row per job inside `.cm-jobs-list`; `''` for no jobs.
- `head(jobs, stopping, collapsed)`: `.cm-jobs-head` with the fold toggle
  (`data-jobs-toggle`, the plan panel's chevron button), the count and, folded, the first
  job's title and line (`Back up the photos · copying 2024-08`).
- `count(running)`: `1 task running`, `2 tasks running`.
- `line(job, isStopping)`: `training · step 240 of 800 · about 11:54 left`, or
  `stopping…` once Cancel was pressed.
- `percent(job)`: 0 to 100 when the job counts steps, else null (no bar).

All text is escaped. A job that cannot be cancelled has no button.
