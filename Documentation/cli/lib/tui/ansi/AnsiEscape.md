# AnsiEscape

`cli/lib/tui/ansi/AnsiEscape.js`

Recognises terminal escape sequences inside a string.

## Methods (static)

- `AnsiEscape.at(str, pos)`: `{ code, length }` for the sequence starting at `pos` (CSI up to its
  final byte; OSC, APC and DCS up to BEL or ST; any other ESC pair), or `null` (none, or unfinished).
- `AnsiEscape.strip(str)`: the visible text.
- `AnsiEscape.ESC`.
