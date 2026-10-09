# AnsiFit

`cli/lib/tui/ansi/AnsiFit.js`

Fits styled strings to a cell width.

## Methods (static)

- `AnsiFit.truncate(str, width, ellipsis = '…')`: cut to `width` cells with the ellipsis when
  something was dropped, closing styles that were open; unchanged when it fits; `''` for width 0.
- `AnsiFit.pad(str, width)`: spaces on the right up to `width` (never cuts).
- `AnsiFit.fit(str, width, ellipsis?)`: truncate, then pad.
- `AnsiFit.seal(str)`: the string plus the codes that close whatever it left open.
