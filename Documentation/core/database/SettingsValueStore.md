# SettingsValueStore

`core/database/SettingsValueStore.js`

Base class for stores that persist one JSON value under a single
SettingsDatabase key.

## Methods

- `new SettingsValueStore(db, storageKey)`; `db` needs `get(key, default)` and
  `set(key, value)`. A missing key throws.
- Subclasses must implement `_emptyValue()` and `_hasValidShape(value)`; the
  base versions throw.
- `_read()` returns the stored value, or a fresh empty value when it is
  missing or has the wrong shape. `_write(value)` stores it.

## Why

ShareStore, TokenStore and UsageStore all repeated the same read-validate-write of one settings key.

[JsonCollectionStore](JsonCollectionStore.md) (agent-manager, mcp-connector,
tool-forge) is the same pattern for named descriptor lists and extends this
class.
