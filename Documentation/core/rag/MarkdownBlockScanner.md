# MarkdownBlockScanner

`core/rag/MarkdownBlockScanner.js`

Reads page text line by line into Markdown blocks with exact offsets: ATX
headings (`#` to `######`, with level and title), fenced code (backticks or
tildes; closed by a fence of the same character at least as long, or the end of
the page), pipe tables (consecutive lines starting with `|`, as
[MarkdownTableRenderer](../shared/content/MarkdownTableRenderer.md) writes
them) and prose (any other run of non-blank lines). Blank lines separate blocks
except inside a fence.

## Methods

- `scan(source)` returns
  `[{ kind: 'heading'|'fence'|'table'|'prose', start, end, level?, title? }]`.
  `end` excludes the line break (and a `\r` before it).

## Why

HTML pages arrive as Markdown from the shared converter and `.md` files are
Markdown already; plain text and PDF pages simply scan as prose, so one scanner
serves every format [DocumentParser](DocumentParser.md) produces. Setext
headings (underlined) are not recognised; the converter never emits them.
