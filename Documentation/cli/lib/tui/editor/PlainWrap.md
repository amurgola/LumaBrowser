# PlainWrap

`cli/lib/tui/editor/PlainWrap.js`

Wrapping for escape-free editor text that keeps character offsets.

## Methods (static)

- `PlainWrap.wrap(line, width)`: rows `[{ start, text }]` of at most `width` cells, breaking after the
  last space in the row when there is one, else mid-word.
- `PlainWrap.truncate(text, width)`: the longest prefix that fits.
