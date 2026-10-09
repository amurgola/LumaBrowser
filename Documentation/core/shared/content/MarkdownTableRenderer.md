# MarkdownTableRenderer

`core/shared/content/MarkdownTableRenderer.js`

Renders rows of plain-text cells as a GitHub-flavored Markdown table.

## Methods

- `MarkdownTableRenderer.render(rows)` takes `string[][]` and returns
  `\n| h1 | h2 |\n| --- | --- |\n| a | b |\n`. Empty or null rows are skipped,
  short rows are padded with empty cells to the widest row, and `|` inside a
  cell is escaped as `\|`. Returns `''` when no row has cells.

## Why

GFM requires a header row, so the first row is always the header, whether or
not the HTML used `th`. Called by [TableBlockRenderer](TableBlockRenderer.md),
which collects the rows.
