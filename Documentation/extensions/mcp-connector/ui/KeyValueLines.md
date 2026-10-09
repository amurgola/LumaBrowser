# KeyValueLines

`extensions/mcp-connector/ui/KeyValueLines.js`

## Methods

- `KeyValueLines.parse(text)`: "KEY=value" per line (CRLF or LF) to an object,
  trimmed; lines without a key before `=` are skipped.
- `KeyValueLines.format(obj)`: the reverse, one line per entry.
