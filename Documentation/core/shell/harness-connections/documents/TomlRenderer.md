# TomlRenderer

`core/shell/harness-connections/documents/TomlRenderer.js`

Writes JavaScript values as TOML source, only for the text LumaBrowser inserts.

## Methods

- `key(name)` bare when it matches `[A-Za-z0-9_-]+`, else a basic string;
  `keyPath(path)` dotted.
- `value(v)` strings (basic, JSON-compatible escapes), integers and floats
  (`nan`, `inf`), booleans, bigints, dates (ISO), arrays and inline tables.
  `null` and other types throw `TOML has no way to write ...`.
- `pair(name, value)` -> `name = value`; `table(path, table, eol)` -> a `[path]`
  section, one line per key, nested tables inline.
