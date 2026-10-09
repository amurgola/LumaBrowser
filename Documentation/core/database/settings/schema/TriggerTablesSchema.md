# TriggerTablesSchema

`core/database/settings/schema/TriggerTablesSchema.js`

DDL (`TriggerTablesSchema.SQL`) for reactive triggers, defined in the trigger
chat mode (TriggerStore owns the CRUD):

- `llm_triggers`: `source`, `action`, `sample`, `last_test` are JSON columns;
  `hook_token` is the webhook credential (the whole URL secret). The setup
  conversation is the live model and tool config. `memory` and `memory_at`
  come from [SettingsMigrations](../SettingsMigrations.md).
- `llm_trigger_runs`: one row per fire. `event` keeps the capped payload so a
  run can be replayed; `dedupe_key` stops redeliveries running twice; `kind`
  is `event`, `test`, `manual` or `replay`; `attempt` and `retry_of` chain retries.
- `llm_trigger_deliveries`: one row per inbound event seen, whatever happened
  to it (answers "why didn't it fire?"); pruned per trigger.
- `llm_trigger_versions`: one row per change of the action. `tested` marks
  versions a passing test vouched for under `config_hash`; `was_armed` is the
  armed state a rollback restores.

Part of [SettingsSchema](../SettingsSchema.md). Ported from legacy
`SettingsDatabase._initTables()`.
