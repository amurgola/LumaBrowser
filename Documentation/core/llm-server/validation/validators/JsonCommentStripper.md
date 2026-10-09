# JsonCommentStripper

`core/llm-server/validation/validators/JsonCommentStripper.js`

Removes line and block comments from JSONC text so `JSON.parse` can read it.

## Methods

- `JsonCommentStripper.strip(source)` returns the text with comments removed.
  Comment markers inside single- or double-quoted strings are kept, an escaped
  quote does not end a string, and an unterminated block comment removes the
  rest of the input. Line comments keep their newline. `null` becomes `''`.

## Why

A regex cannot tell a `//` inside a URL string from a real comment, so this is
a small character scanner that tracks whether it is inside a string.
