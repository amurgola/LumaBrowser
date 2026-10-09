# HtmlNode

`core/shared/content/HtmlNode.js`

One node of the converter's document tree: an element (`name`, `attributes`,
`children`, `parent`) or a decoded text run (`name === '#text'`, `text`).

## Methods

- `HtmlNode.element(name, attributes)`, `HtmlNode.text(value)`: factories.
- `isText`, `append(child)`, `remove()`.
- `attribute(name)` (null if absent), `hasAttribute(name)`.
- `identityTokens()`: lower-cased `class` and `id` tokens, for chrome hints.
- `elementChildren()`, `descendants()` (generator, document order),
  `find(name)`, `findAll(predicate)`.
- `plainText()`: text exactly as written with `<br>` as a newline (for `<pre>`).

## Why

A tree, rather than a tag stream, lets the pruners score whole blocks and the
renderers format a block from its finished contents.
