# ExtensionDisplayName

`core/llm-service/tools/ExtensionDisplayName.js`

Readable labels for MCP aggregator source ids, used as chat tool-group titles.

## Methods

- `ExtensionDisplayName.forSource(source)`: `ext.<id>` -> `forExtension(id)`;
  `core.<id>` -> title-cased id; nothing -> `'Extension tools'`; anything else
  unchanged.
- `ExtensionDisplayName.forExtension(id)`: the `name` from
  `extensions/<id>/manifest.js` (path-loaded), else the title-cased id. Cached
  per id.
- `ExtensionDisplayName.titleCase(id)`: `'timed-tasks'` -> `'Timed Tasks'`.

## Why

The aggregator only knows `ext.timed-tasks`; the user knows the extension by
the name the Extensions tab shows. Sideloaded add-ons have no built-in
manifest and fall back to the title-cased id.
