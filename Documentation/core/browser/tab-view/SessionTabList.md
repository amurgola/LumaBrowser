# SessionTabList

`core/browser/tab-view/SessionTabList.js`

The settings-db snapshot of the last session's strip, `{ tabs: [{ url, title }], activeIndex }`,
under `core.browser.sessionTabs`. A [SettingsValueStore](../../database/SettingsValueStore.md).

## Methods

- `new SessionTabList(db)`; `SessionTabList.STORAGE_KEY`.
- `read()`: the stored snapshot. Rows that are not objects or have no `url` are dropped; a non-integer
  `activeIndex` reads as `-1`; a missing or corrupt value reads as `{ tabs: [], activeIndex: -1 }`.
- `write({ tabs, activeIndex })`: stores `{ url, title }` for each tab plus the active index.
