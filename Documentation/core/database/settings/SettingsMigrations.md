# SettingsMigrations

`core/database/settings/SettingsMigrations.js`

Adds the columns that shipped after their table did.

## Methods

- `SettingsMigrations.apply(db)` adds every missing column in
  `ADDED_COLUMNS` through [SqliteSchema.ensureColumn](../SqliteSchema.md) and
  returns the added ones as `['table.column', ...]`. When `llm_artifacts`
  gained `root_id` or `version`, every artifact without a root becomes its own
  version-1 root (`root_id = id`). When `llm_messages` gained `parent_id`,
  every conversation's rows are linked into the chain they were shown as
  ([MessageTree](../../llm-server/chat/MessageTree.md)`.legacyParents`), in
  one transaction.
- `SettingsMigrations.ADDED_COLUMNS`: `[table, column, ddl]` in shipping order.

## Notes

`llm_triggers.memory` and `memory_at` are not in the CREATE TABLE at all, so
they are added by this class on fresh databases too. That matches legacy.
