# JsoncSplicer

`core/shell/harness-connections/documents/JsoncSplicer.js`

Text surgery on valid JSON/JSONC. jsonc-parser only locates nodes
(`findNodeAtLocation`) and commas (`createScanner`); the splicer writes the text.

## Methods

- `new JsoncSplicer(text)`; `set(path, value)` and `remove(path)` return new text.

## Rules

- Replace: only the value's characters change; objects are pretty-printed from the
  indentation of the line they start on.
- Add to a multi-line object: a new line after the last property, with its
  indentation; a trailing-comma style is followed, otherwise a comma is added after
  the previous property. Missing parent objects are created; a parent that is not an
  object throws `Cannot add <path>: <parent> is not an object.`
- Add to a single-line object: stays on one line. Add to `{}`: a block one indent
  deeper; an object holding only comments keeps them below the new line.
- Remove: a property on its own lines goes with its lines (and the comma we added
  before it); inline ones go with their separating comma; the only property of an
  object without comments leaves `{}`.
- Indent unit (tab or N spaces) and line ends (LF/CRLF) are read from the file.

## Why

Every add has an exact inverse, so key-by-key undo gives back the user's file byte
for byte, comments and odd formatting included.
