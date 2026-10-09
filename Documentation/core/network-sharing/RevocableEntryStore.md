# RevocableEntryStore

`core/network-sharing/RevocableEntryStore.js`

Base class (extends [SettingsValueStore](../database/SettingsValueStore.md))
for the network-sharing credential lists: entries shaped
`{ id, token, revoked, ... }` stored as one JSON array.

## Methods

- `revoke(id)` marks one entry revoked; false when the id is unknown.
- `revokeAll()` marks every entry revoked; returns true.
- For subclasses: `_findLive(predicate)` (first non-revoked match or null),
  `_removeWhere(predicate)` (true when anything was removed),
  `RevocableEntryStore._maskToken(token, visibleChars)` (prefix plus an
  ellipsis, null for a non-string).

## Why

Entries are revoked rather than deleted so the host UI can still show them.
Token values never leave the store unmasked through `list()`.
