# SourceCursor

`core/shell/shellClassifier/syntax/SourceCursor.js`

A read position over a command line's text.

## Methods

- `new SourceCursor(text, position = 0)`; fields `text`, `position`; getter `atEnd`.
- `peek(offset = 0)`: the character ahead, `''` past the end.
- `startsWith(fragment)`, `take(count = 1)`, `takeWhile(predicate)`, `skipToEnd()`, `sliceFrom(start)`,
  `restOfLine()` (up to, not including, the next newline).

## Why

Every reader consumes whole constructs; sharing one cursor keeps them free of index arithmetic.
