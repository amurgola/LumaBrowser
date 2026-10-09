# KeyPath

`core/shell/harness-connections/documents/KeyPath.js`

Key paths (arrays of key names) into parsed config data.

## Methods

- `lookup(data, path)` -> `{ present: false }` or `{ present: true, value }`; only
  own keys of tables count, so an absent key and a key holding `null` differ.
- `firstMissing(data, path)` the shortest absent prefix (the first container a
  write would create), or null.
- `startsWith(path, prefix)`, `equals(a, b)`.
- `label(path)` dotted form for previews and drift (`mcp_servers.luma-browser`),
  quoting keys that are not bare. `BARE_KEY` is the bare-key pattern.

## Why

"Was it absent?" is the difference between restoring a value and deleting a key
on disconnect, so lookups must not collapse absent into undefined.
