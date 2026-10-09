# QuoteBlockRenderer

`core/shared/content/QuoteBlockRenderer.js`

A [BlockRenderer](BlockRenderer.md) for `<blockquote>`.

## Methods

- `render(node, writer)`: the contents rendered as blocks, each line prefixed
  `> ` and blank lines written as `>`; nothing for an empty quote.

## Why

Prefixing finished output keeps nested quotes, lists and code inside a quote
intact.
