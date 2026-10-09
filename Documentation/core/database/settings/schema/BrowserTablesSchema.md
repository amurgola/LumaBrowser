# BrowserTablesSchema

`core/database/settings/schema/BrowserTablesSchema.js`

DDL (`BrowserTablesSchema.SQL`) for core browser data:

- `browser_history`: one row per visit, so History lists visits in order while
  autocomplete aggregates by url (HistoryStore).
- `bookmarks`: one self-referencing tree. `parent_id` NULL is the bar; `type`
  is `bookmark` or `folder`; `position` orders siblings; `open_on_startup`
  opens the bookmark in a tab at launch (BookmarkStore).

Part of [SettingsSchema](../SettingsSchema.md). Ported from legacy
`SettingsDatabase._initTables()`.
