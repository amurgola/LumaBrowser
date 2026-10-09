# ChatTablesSchema

`core/database/settings/schema/ChatTablesSchema.js`

DDL for the LLM chat tables. Core owns them (the LLM Server is a core
feature); ChatStore and the artifact stores provide typed CRUD over the same
handle.

- `ChatTablesSchema.SQL` creates the tables and their indexes.
- `ChatTablesSchema.POST_MIGRATION_SQL` creates `idx_llm_artifacts_root`,
  which [SettingsSchema](../SettingsSchema.md) runs after the migrations.

## Columns that need explaining

`llm_conversations`:

- `hidden`: system-owned transcripts (scheduled-run transcripts); excluded from
  the sidebar and search, still fetchable by id.
- `disabled_tools`: JSON array of tool names unchecked in the chat's gear
  panel. NULL or empty means every tool the global catalog allows.
- `choices_enabled`: "Suggest replies"; 1 asks for three reply choices. NULL
  (never set by the UI) is treated as off.
- `reasoning_effort`: the thinking pill (`off`, `default`, `low`, `medium`,
  `high`, `xhigh`). NULL inherits the global default, which is not the same as
  `'default'` (an explicit "let the model decide").
- `mode`: `'chat'` or an extension chat mode id; a cheap list-time
  discriminator. The mode's payload lives in `llm_conversation_meta.data`.

`llm_conversation_meta`: one row per conversation in a non-default mode; `data`
is a JSON blob owned by the mode. Core stores it and never interprets it.

`llm_messages.variant_group` / `variant_active`: regeneration variants share a
group (the first variant's id); exactly one is active. Normal messages have a
NULL group and are always active.

`llm_artifacts.root_id` / `version`: every edit is a new row sharing the first
version's id as `root_id`. Lists collapse by root to the highest version; v1
has `root_id = id`. Content is kept so a reopened chat can reopen artifacts
after the temp file is gone.

`llm_artifact_data`: persistent JSON for live artifacts, one row per root;
`rev` is a monotonic change counter for cache reconciliation.
