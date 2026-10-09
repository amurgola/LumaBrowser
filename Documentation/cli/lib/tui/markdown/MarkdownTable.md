# MarkdownTable

`cli/lib/tui/markdown/MarkdownTable.js`

A markdown table as terminal lines.

## Methods (static)

- `MarkdownTable.render(rows, width, theme)`: `rows` are the table lines without the separator row.
  Cells get inline styling; the header row is bold with a `─┼─` rule under it; columns are joined with
  ` │ `; the widest column shrinks one cell at a time (not below `MIN_COLUMN`, 6) until the table fits.
