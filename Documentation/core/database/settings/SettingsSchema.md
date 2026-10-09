# SettingsSchema

`core/database/settings/SettingsSchema.js`

Creates every table in the settings database and upgrades older databases in
place. Safe on every boot.

## Methods

- `SettingsSchema.apply(db)` runs, in order: each table group's `SQL`
  (`CREATE TABLE/INDEX IF NOT EXISTS`), [SettingsMigrations](SettingsMigrations.md),
  then indexes that need migrated columns (`ChatTablesSchema.POST_MIGRATION_SQL`).
- `SettingsSchema.TABLE_GROUPS`: [AppTablesSchema](schema/AppTablesSchema.md),
  [ChatTablesSchema](schema/ChatTablesSchema.md),
  [ScheduledWorkTablesSchema](schema/ScheduledWorkTablesSchema.md),
  [TriggerTablesSchema](schema/TriggerTablesSchema.md),
  [BrowserTablesSchema](schema/BrowserTablesSchema.md).

## Why the order

`CREATE TABLE IF NOT EXISTS` never adds a column to an existing table, and an
index on a missing column fails. So the `(root_id, version)` artifact index is
built only after the migrations guarantee `root_id` on both fresh and upgraded
databases.
