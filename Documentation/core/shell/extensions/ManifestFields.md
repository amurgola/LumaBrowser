# ManifestFields

`core/shell/extensions/ManifestFields.js`

Normalises the loosely shaped manifest fields so every reader agrees.

## Methods

- `ManifestFields.file(definition)` the file of a surface field given as
  `'file.js'` or `{ file, ... }`; null when absent.
- `ManifestFields.option(definition, key)` an option of the object form
  (`prefix`, `id`, `label`), null for the string form or a falsy value.
- `ManifestFields.actions(manifest)` `extensionsActions` when it is an array,
  else `[extensionsAction]`, else `[]`.
