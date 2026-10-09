# PersistedTabs

`core/browser/tab-view/PersistedTabs.js`

Persisted (keep-alive) tabs: hidden instead of destroyed on close, saved to the
settings db, recreated hidden in their own partition at boot.

## Methods

- `new PersistedTabs({ db, registry, channel, createTab, destroyTab })`; without a
  db nothing is saved or restored.
- `reservedPartitions` (Set): partitions owned by persisted tabs, loaded from the
  stored list at construction. `reserve(partition)`.
- `save()` rewrites the stored list from the live persisted entries (warns on failure).
- `forget(entry)` drops the reservation and rewrites the list (a destroyed persisted tab).
- `setPersistence(tabId, persist)` -> `{ success, keepAlive }`. Only regular browsing
  tabs; un-persisting a hidden tab destroys it.
- `list()`: serialized persisted tabs, visible and hidden (the quick-view list).
- `restore()` -> count. Skips rows without url or partition and tabs already live
  (same url and partition). Restored tabs are hidden, muted and never activated.
- `revive(entry)`: destroys and recreates a persisted tab whose webContents is beyond
  reload, keeping partition, title and hidden state; never steals focus.

## Why

A persisted tab keeps its renderer alive so notifications keep flowing (it is
muted while hidden). Persisted tabs created before the shared partition existed
live in a private `persist:main-<n>`; they are restored into that same partition
so their logins survive, and the partition is reserved so nothing else gets it.
Navigation and title changes of a persisted tab call `save()` so a restart
reopens it where the user left off.
