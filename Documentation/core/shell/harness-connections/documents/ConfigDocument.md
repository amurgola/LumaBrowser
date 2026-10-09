# ConfigDocument

`core/shell/harness-connections/documents/ConfigDocument.js`

Base class for an editable config file. Subclasses:
[JsoncDocument](JsoncDocument.md), [TomlDocument](TomlDocument.md).

## Methods

- `Format.open(text)`: `null` (missing file) and blank text open as the format's
  `EMPTY` document. A leading byte-order mark is kept on output.
- `data()` the parsed value; `readPath(path)` -> [KeyPath](KeyPath.md) lookup.
- `set(path, value)` / `remove(path)`: no-ops when nothing would change; otherwise
  splice the text, re-parse, and confirm the key now holds exactly the value (or is
  gone). A splice that lands anywhere else throws
  `Could not safely edit <path>; the file was left unchanged.`
- `edited()` whether any edit changed the text; `isBlank()` no keys and no comments;
  `toString()` the current text.

## Subclass hooks

`_parse(text)` (throw a readable message), `_textWith(path, value)`,
`_textWithout(path)`, and the statics `ID`, `LABEL`, `EMPTY`.

## Why

Every format edits text surgically to keep the user's comments and layout; the
re-parse check makes a splicing bug fail loudly instead of corrupting a file.
