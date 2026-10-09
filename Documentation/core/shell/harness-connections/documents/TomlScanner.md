# TomlScanner

`core/shell/harness-connections/documents/TomlScanner.js`

Splits already-valid TOML text (validated by smol-toml first) into statements
with exact character spans.

## Methods

- `TomlScanner.scan(text)` -> statements:
  - `{ kind: 'table' | 'array-table', path, start, end }` for `[a.b]` / `[[a]]`;
  - `{ kind: 'pair', path, inArrayTable, start, end, valueStart, valueEnd }` where
    `path` is the full key path (table path plus dotted key).
  `start`/`end` cover whole lines including the trailing comment and line break.

## Handles

Comments, blank lines, bare / basic / literal / dotted keys (with TOML escapes),
basic and literal strings, multi-line strings (with up to two extra closing
quotes), multi-line arrays and inline tables with comments, local date-times with a
space, CRLF, and a last line without a break. Text that is not TOML throws
`TOML scan: ...` rather than producing wrong spans.

## Why

smol-toml parses values but does not report source positions; the scanner gives
TomlDocument the positions needed to change one statement and leave every other
character alone, including `[` at the start of a line inside a string or array.
