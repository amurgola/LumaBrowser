# RecordId

`core/database/RecordId.js`

Mints sortable, collision-resistant record ids: `<prefix>_<epochMs>_<random7>`.

## Methods

- `RecordId.create(prefix)` returns a new id.

## Why

Ids are time-prefixed on purpose: they sort chronologically as plain strings,
which several list queries rely on as a tiebreak.
