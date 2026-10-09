# MarkdownInline

`core/llm-server/ui/js/markdown/MarkdownInline.js`

The chat markdown's inline rules, applied to text that is already escaped.

## Methods

- `MarkdownInline.render(text)` applies, in order: `` `code` ``, `**bold**`,
  `*italic*`, `![alt](https://...)` images (https only, `class="cm-md-img"`,
  `referrerpolicy="no-referrer"`, `loading="lazy"`, `decoding="async"`), then
  `[text](http(s)://...)` links (`target="_blank" rel="noopener"`). Images run
  before links, or the link rule would take the `[alt](url)` part and leave a
  stray `!`. Any other scheme (`javascript:`, `data:`, `vbscript:`) stays text.

## Globals

None.
