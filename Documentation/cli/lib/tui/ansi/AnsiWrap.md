# AnsiWrap

`cli/lib/tui/ansi/AnsiWrap.js`

Word-wraps styled text to a cell width.

## Methods (static)

- `AnsiWrap.wrap(text, width)`: lines of at most `width` cells (`width` below 1 counts as 1); input
  newlines are kept; styles open at a break are closed at the end of the line and reopened on the
  next; a word wider than the line is split; CJK may break anywhere. No padding. Never empty.
