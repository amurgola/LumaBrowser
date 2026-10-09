# MarkdownBlocks

`core/llm-server/ui/js/markdown/MarkdownBlocks.js`

The block pass of [MarkdownRenderer](MarkdownRenderer.md). One instance per
render, because it tracks the open list.

## Methods

- `new MarkdownBlocks().render(escaped)` walks already-escaped text line by line:
  `#` to `####` headings, `---`/`***`/`___` rules, `-`/`*`/`+` and `1.`/`1)`
  lists (switching type closes the list), blank lines, and paragraphs. Every
  text part goes through [MarkdownInline](MarkdownInline.md). Adjacent
  paragraphs are joined with `<br/>`.

The `>` quote branch is unreachable on real input (escaping already turned `>`
into `&gt;`); kept as legacy behaviour.

## Globals

None.
