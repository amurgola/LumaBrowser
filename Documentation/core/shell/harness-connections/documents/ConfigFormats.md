# ConfigFormats

`core/shell/harness-connections/documents/ConfigFormats.js`

Maps the format id stored in a ledger entry (`'jsonc'`, `'toml'`) back to its
document class.

## Methods

- `ConfigFormats.byId(id)` -> [JsoncDocument](JsoncDocument.md) or
  [TomlDocument](TomlDocument.md); an unknown id throws `Unknown config format: <id>`.
- `ConfigFormats.ALL` the known formats.

## Why

The manifest is JSON and cannot hold classes; disconnect reopens each file with
the format it was written in.
