# HtmlEscaper

`core/llm-server/ui/js/format/HtmlEscaper.js`

The renderer's HTML escapers. Use `escape` for anything interpolated into HTML
text or a quoted attribute.

## Methods

- `HtmlEscaper.escape(value)` escapes `& < > " '` (`'` as `&#39;`), `&` first so
  entities are not double-encoded. `null`/`undefined` become `''`; other values
  are stringified.
- `HtmlEscaper.escapeKeepingApostrophes(value)` escapes `& < > "` and leaves `'`
  raw. Only the markdown renderer and code highlighter use it: the highlighter
  matches single-quoted strings on escaped text, and an `&#39;` would also
  trigger its `#` comment rule. Safe for text and double-quoted attributes.
- `HtmlEscaper.escapeText(value)` escapes `& < >` only, for element text such as
  the live-module error block (the pop-out page escapes the same three).

## Why five entities

Legacy once had 19 escapers in 5 entity sets, and several left `"` unescaped
while being interpolated into quoted attributes, so a model display name with a
quote broke out of `title="..."` (bug C1). The tests pin the breakout cases.

## Globals

None.
