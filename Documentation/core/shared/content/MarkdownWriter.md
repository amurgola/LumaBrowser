# MarkdownWriter

`core/shared/content/MarkdownWriter.js`

Output buffer that owns Markdown spacing.

## Methods

- `new MarkdownWriter({ inline })`; `inline` is readable.
- `text(value)`: prose; whitespace runs collapse to one space, never doubled
  across calls and never at the start of a line.
- `lineBreak()`: one newline. `blockBreak()`: at most one blank line.
- `block(markdown)`: verbatim pre-formatted Markdown set off by blank lines.
- `toString()`: block mode trims; inline mode collapses all whitespace to
  single spaces and keeps outer spaces.

In inline mode, line breaks, block breaks and blocks all become spaces.

## Why

Keeping spacing rules in one place means nothing post-processes the output
with regexes that could damage code blocks. Inline mode serves links, headings
and table cells, which must stay on one line.
