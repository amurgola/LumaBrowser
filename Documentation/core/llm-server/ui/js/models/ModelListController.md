# ModelListController

`core/llm-server/ui/js/models/ModelListController.js`

The handle a section gets back from `ModelList.mount`.

## Methods

- `set(rows, { preserveExpanded }?)`: structural refresh (rebuilds every row). A row that was expanded stays expanded unless `preserveExpanded: false`; a row that asks to be open wins too.
- `patchRow(key, patch)` mutates one row's fields in place so only that row repaints (live progress). False for an unknown key.
- `patchAll(fn)`: `fn(row, index)` returns a patch or null, applied to every row.
- `getRow(key)` returns the reactive row or null; `ns` is the namespace.

## Globals

None (reads `resonant.data[ns]`).
