# NetworkWatcherRepository

`core/database/settings/NetworkWatcherRepository.js`

Raw SQL over `network_watchers`, mapping columns to camelCase watcher objects
`{ id, urlPattern, sendTo, note, method, captureHeaders, captureBody, enabled,
triggerCount, lastTriggered, lastCapturedResponse, createdAt }`.

## Methods

- `addWatcher(watcher)`: method defaults to `'*'`, booleans stored as 0/1,
  `lastCapturedResponse` as JSON.
- `hasWatcher(urlPattern, method = '*')`.
- `updateWatcher(id, data)` writes only the fields present (`COLUMNS` maps
  field to column); an empty patch writes nothing.
- `removeWatcher(id)` true when a row went; `getAllWatchers()`.
