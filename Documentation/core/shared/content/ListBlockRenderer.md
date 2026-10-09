# ListBlockRenderer

`core/shared/content/ListBlockRenderer.js`

A [BlockRenderer](BlockRenderer.md) for `<ul>`, `<ol>` and `<menu>`.

## Methods

- `render(node, writer)`: each item's content rendered as blocks, prefixed with
  `- ` or `N. ` (from `<ol start>`, default 1), continuation lines indented to
  the marker width. Stray text or elements directly in the list become items;
  empty items and lists vanish.

## Why

Rendering items as blocks makes nested lists, code and paragraphs inside an
item work without tracking list depth. Blank lines inside an item are dropped
(tight lists cost fewer tokens) unless the item holds a fence, where blank
lines are code.
