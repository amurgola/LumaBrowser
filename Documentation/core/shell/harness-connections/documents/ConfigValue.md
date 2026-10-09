# ConfigValue

`core/shell/harness-connections/documents/ConfigValue.js`

Value rules shared by every config format.

## Methods

- `isTable(value)` plain or null-prototype object (TOML tables parse with a null
  prototype); arrays and dates are not tables. `isEmptyTable(value)`.
- `same(a, b)` content equality, so a parsed TOML table equals the object it was
  rendered from.
- `plain(value)` the JSON-safe copy stored in the ledger (undefined stays undefined).

## Why

The ledger compares values read from different parsers with values stored as
JSON; comparing by content avoids prototype and date-object differences.
