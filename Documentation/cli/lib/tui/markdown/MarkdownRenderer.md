# MarkdownRenderer

`cli/lib/tui/markdown/MarkdownRenderer.js`

Markdown to terminal lines already wrapped to a width.

## Methods

- `MarkdownRenderer.render(md, width, theme)`: the lines (leading and trailing blanks dropped). One
  instance per call walks the source; each block handler consumes the lines it owns:
  - fenced code (backticks or tildes, unterminated means "to the end"), boxed with the language;
  - ATX headings (levels 1 and 2 bold accent with a rule under, deeper bold text);
  - rules; blockquotes (rendered recursively behind the accent bar, italic);
  - tables ([MarkdownTable](MarkdownTable.md)); bullet, numbered and task lists, nested by indent
    (up to three levels), with indented continuation lines;
  - four-space or tab indented code outside a list; paragraphs (joined, then wrapped).
  Inline styling is [MarkdownInline](MarkdownInline.md).

## Why

The whole answer is re-rendered every frame while it streams, so the renderer must cope with
half-written input (an open fence, a half table).
