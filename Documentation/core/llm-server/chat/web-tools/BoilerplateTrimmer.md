# BoilerplateTrimmer

`core/llm-server/chat/web-tools/BoilerplateTrimmer.js`

Trims page furniture from the edges of extracted Markdown.

## Methods (static)

- `trim(markdown)` -> `{ text, trimmedBlocks }`: blank-line separated blocks
  are dropped from the start and the end while they are empty or furniture.
  If what remains is empty or under `MIN_KEPT_SHARE` (20%) of the text, the
  page is returned whole with `trimmedBlocks: 0`.
- `isFurniture(block)`: link labels make up at least `LINK_DENSITY_LIMIT` (0.5)
  of the block's visible characters (links counted as their labels; Markdown
  markers and whitespace not counted). A block without links is never furniture.

## Why

`HtmlToMarkdown` drops `<nav>`, `<footer>` and `<aside>`, but many sites build
menus, breadcrumbs and footers from plain lists, which then fill the first part
of every page. Link density is the standard boilerplate signal (prose links a
few words per paragraph; menus are nearly all link text). Only the edges are
trimmed: a link list mid-page is usually content (a table of contents, a
reference list). A page that is mostly links is an index, so it is kept whole.
