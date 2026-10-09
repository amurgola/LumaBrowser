# MarkdownRenderer

`core/shared/content/MarkdownRenderer.js`

Walks a pruned tree and writes Markdown through a
[MarkdownWriter](MarkdownWriter.md).

## Methods

- `new MarkdownRenderer({ urlResolver })` (default: a resolver with no base).
- `render(root)` / `renderBlocks(node)`: a node's contents as trimmed blocks.
- `renderInline(node)`: contents flattened to one line, outer spaces kept.
- `renderChildren(node, writer)`: writes each child into `writer`.

## What it writes

- Structured blocks via the [BlockRenderer](BlockRenderer.md) subclasses.
- `h1` to `h6` as `#` lines (only the words in an inline context).
- `<a>` as `[text](url)` when [UrlResolver](UrlResolver.md) yields a URL
  (spaces and parentheses percent-encoded), else just its text; links with no
  text vanish.
- `strong`/`b` as `**`, `em`/`i` as `_`, `del`/`s`/`strike` as `~~`, wrapped
  around the trimmed words so `a<b> b </b>c` gives `a **b** c`.
- `code`/`kbd`/`samp` as backtick-safe inline code.
- `br` a line break, `hr` `---`, block containers separate paragraphs, other
  elements pass their text through.

## Why

Markdown punctuation in prose is not escaped: escapes cost tokens and models
read the unescaped text correctly. Underline, mark and similar have no Markdown
form and stay plain text rather than inventing syntax.
