# NodeTextStats

`core/shared/content/NodeTextStats.js`

Per-element text totals, measured in one post-order pass.

## Methods

- `NodeTextStats.measure(root)` returns a stats instance.
- `of(node)` returns `{ chars, linkChars, links }`: whitespace-collapsed
  visible characters, characters inside `<a href>`, and the number of
  `<a href>`; `EMPTY` for unknown nodes.
- `linkDensity(node)`: `linkChars / chars`, 0 for no text.

## Why

Link density (the share of a block's text that is anchor text) is the
strongest cheap boilerplate signal in the published research: menus approach
1.0 and prose sits near 0. Measuring once keeps scoring linear in page size.
Used by [ContentRootLocator](ContentRootLocator.md) and
[BoilerplatePruner](BoilerplatePruner.md).
