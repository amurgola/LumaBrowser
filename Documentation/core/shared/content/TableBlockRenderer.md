# TableBlockRenderer

`core/shared/content/TableBlockRenderer.js`

A [BlockRenderer](BlockRenderer.md) for `<table>`.

## Methods

- `render(node, writer)`: rows from direct `tr`s and `thead`/`tbody`/`tfoot`;
  cells (`td`/`th`) rendered inline; a cell with `colspan` followed by empty
  cells (bounded by `MAX_COLSPAN`, 20); then the caption and a GFM table from
  [MarkdownTableRenderer](MarkdownTableRenderer.md). Layout tables
  (`role="presentation"` or `"none"`, or one column wide) are unwrapped into
  ordinary blocks. In an inline context (a cell, a link) a table contributes
  only its words.

## Why

GFM tables are compact and models read them well, but they cannot merge cells:
spreading a `colspan` into empty cells keeps the other columns aligned.
One-column grids are page layout, where a Markdown table would add pipes and
nothing else.
