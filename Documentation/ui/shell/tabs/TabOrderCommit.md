# TabOrderCommit

`ui/shell/tabs/TabOrderCommit.js`

Persists a drag-reorder: translates "dropped before tab X" into an index in main's full order, which also holds tabs with no strip element.

## Methods

- `TabOrderCommit.commit(api, domOrder, movedId)`.
- `TabOrderCommit.targetIndex(full, domOrder, movedId)`.

## Globals

None (the api is passed in).
