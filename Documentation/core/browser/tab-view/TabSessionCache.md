# TabSessionCache

`core/browser/tab-view/TabSessionCache.js`

Clears the HTTP and disk cache of every session tabs use.

## Methods

- `TabSessionCache.clearAll(entries)` -> `{ success: true, sessions }`: the shared
  tab partition, each entry's partition (each partition once) and the default
  session. A session that fails is logged and skipped.

Exposed as `TabViewManager.clearCache()` (IPC `tab-view:clear-cache`).
