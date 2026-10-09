# MarkdownInline

`cli/lib/tui/markdown/MarkdownInline.js`

Inline markdown to a styled, unwrapped string.

## Methods (static)

- `MarkdownInline.render(text, theme)`: code spans first (stashed behind `\x00n\x00` placeholders so
  nothing inside them is styled, shown in the warn colour), backslash escapes (behind `\x01code\x01`),
  `[label](url)` and bare http(s)/file URLs as underlined accent hyperlinks, `**bold**`, `__bold__`,
  `*italic*`, `_italic_`, `~~strike~~`.
