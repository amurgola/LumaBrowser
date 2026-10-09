# ScheduledWorkTablesSchema

`core/database/settings/schema/ScheduledWorkTablesSchema.js`

DDL (`ScheduledWorkTablesSchema.SQL`) for recurring background agent work:

- `llm_artifact_tasks`: a recurring run that refreshes a live artifact's data,
  keyed by the artifact chain's `root_id`; the scheduler scans `next_run_at`.
- `llm_artifact_task_runs`: one row per run. `conversation_id` points at the
  run's hidden transcript and is nulled when old transcripts are pruned; the
  row (status, summary) is kept.
- `llm_scheduled_tasks`: user-defined recurring runs from the scheduled-task
  chat mode. The owning conversation is the live config: each run reads its
  `model_ref` and `disabled_tools`.
- `llm_scheduled_task_runs`: one row per run; `response` keeps the model's
  final message after the transcript is pruned. `kind` is `scheduled`,
  `manual` or `test`.

Part of [SettingsSchema](../SettingsSchema.md). Ported from legacy
`SettingsDatabase._initTables()`.
