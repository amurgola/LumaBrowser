# ResolutionCacheSnapshot

`core/browser/resolution-cache/ResolutionCacheSnapshot.js`

Persists the resolution cache as one settings value,
`{ v: 1, entries: [[key, entry], ...] }` in LRU order, under
`core.browser.resolutionCache`. A [SettingsValueStore](../../database/SettingsValueStore.md).

## Methods

- `new ResolutionCacheSnapshot(db)`; `STORAGE_KEY`, `VERSION`.
- `load()`: a Map of the saved rows; rows that are not `[string, { selector }]` are
  skipped, and a missing or corrupt value loads as empty.
- `save(map)`.
