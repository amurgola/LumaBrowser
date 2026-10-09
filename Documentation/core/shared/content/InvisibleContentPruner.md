# InvisibleContentPruner

`core/shared/content/InvisibleContentPruner.js`

A [TreePruner](TreePruner.md) that removes what a reader never sees as prose.

## Methods

- `shouldDrop(node)`: true for [HtmlElementCatalog](HtmlElementCatalog.md)
  non-content elements, and for elements with `hidden`, `aria-hidden="true"`,
  or an inline `display:none` / `visibility:hidden` style.

## Why

It runs before content location so script text and hidden drafts never inflate
a block's score. Only inline styles are visible without a CSS engine.
