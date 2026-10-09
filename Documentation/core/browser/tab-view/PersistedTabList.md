# PersistedTabList

`core/browser/tab-view/PersistedTabList.js`

The settings-db list of persisted tabs, `[{ url, title, partition }]`, under
`core.browser.persistedTabs`. A [SettingsValueStore](../../database/SettingsValueStore.md).

## Methods

- `new PersistedTabList(db)`; `PersistedTabList.STORAGE_KEY`.
- `read()`: the stored rows (non-object rows dropped); a missing or corrupt value reads as `[]`.
- `write(entries)`: stores `{ url, title, partition }` for each entry.
