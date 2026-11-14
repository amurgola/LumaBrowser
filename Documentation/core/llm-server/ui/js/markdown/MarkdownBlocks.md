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

A blank line or a paragraph ends the open list. A numbered list whose items are
spaced out, or that has a paragraph under each item, therefore becomes several
`<ol>` lists. Each one opens at the number its first item was written with
(`<ol start="2">`; a list starting at 1 keeps the plain `<ol>`), so the steps
read 1, 2, 3 instead of 1, 1, 1. A number too large to be a safe integer is
ignored.

The `>` quote branch is unreachable on real input (escaping already turned `>`
into `&gt;`); kept as legacy behaviour.

## Globals

None.
