# AppTablesSchema

`core/database/settings/schema/AppTablesSchema.js`

DDL (`AppTablesSchema.SQL`) for the app's own tables:

- `settings (key, value)`: every setting as text; see
  [SettingsRepository](../SettingsRepository.md).
- `network_watchers`: URL-pattern watchers, unique per `(url_pattern, method)`.

It also runs `DROP TABLE IF EXISTS` for `page_templates` and `template_gen_runs`,
the tables of the removed page-template system, so an older database is cleaned
up on open (the owner decided that data is worthless). Idempotent like the rest
of the pass.

Part of [SettingsSchema](../SettingsSchema.md). Ported from legacy
`SettingsDatabase._initTables()`.
