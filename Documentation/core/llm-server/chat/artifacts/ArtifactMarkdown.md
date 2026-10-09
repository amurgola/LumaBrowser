# ArtifactMarkdown

`core/llm-server/chat/artifacts/ArtifactMarkdown.js`

A compact CommonMark-ish converter for markdown artifacts.

## Methods

- `ArtifactMarkdown.toHtml(markdown)`: `''` for empty input. Supports fenced
  code (escaped, never inside a `<p>`), GFM tables, `#`..`####` headings,
  `---` / `***` / `___` rules, `-`/`*`/`+` and numbered lists, paragraphs,
  and inline code, bold, italic and `http(s)` links.

## Rules

Markdown artifacts are rendered only by this path (the side panel iframes the
document rather than using the chat's markdown renderer), so anything it cannot
parse is unreachable for the user.

Fences and tables are parked as placeholders before the line walk, so the walk
cannot wrap them in a `<p>` or run inline rules over them. The table recogniser
is the chat renderer's (`core/llm-server/ui/js/markdown.js`).

Known gap, kept as characterised behaviour: the text is escaped before the
line walk, so a `>` is already `&gt;` and the blockquote branch never fires
(`> quoted` renders as a paragraph). The chat renderer has the same dead branch;
fixing it belongs with a shared-renderer extraction.
