# BlockRenderer

`core/shared/content/BlockRenderer.js`

Base class for renderers of structured blocks.

## Methods

- `constructor(renderer)`: keeps the [MarkdownRenderer](MarkdownRenderer.md)
  as `this.renderer`, for rendering contents.
- `elementNames` (getter, override): the element names owned.
- `matches(node)`: true when the node's name is owned.
- `render(node, writer)`: override; the base throws.

## Why

Code, lists, quotes and tables each need their whole contents before they can
be formatted, and each is self-contained. A shared shape lets the main renderer
dispatch to them without knowing their details. Subclasses:
[CodeBlockRenderer](CodeBlockRenderer.md), [ListBlockRenderer](ListBlockRenderer.md),
[QuoteBlockRenderer](QuoteBlockRenderer.md), [TableBlockRenderer](TableBlockRenderer.md).
