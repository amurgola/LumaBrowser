# CodeBlockRenderer

`core/shared/content/CodeBlockRenderer.js`

A [BlockRenderer](BlockRenderer.md) for `<pre>`.

## Methods

- `render(node, writer)`: a fenced block of the exact text (`<br>` as a
  newline), with the newline right after `<pre>` and trailing blank lines
  dropped; nothing for blank code.
- `CodeBlockRenderer.fenceFor(code, minimum)`: a backtick fence one longer than
  the longest backtick run in `code` (also used for inline code).

## Why

The language label tells the model how to read the code. It comes from
`data-lang` / `data-language`, or from highlighter class conventions
(`language-x` / `lang-x`, `highlight-source-x`, `brush: x`) on the `<pre>` or
its `<code>`; labels meaning "no language" are dropped. A fence longer than any
backtick run inside means code containing a fence cannot end its own block.
