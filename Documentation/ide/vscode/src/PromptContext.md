# PromptContext

`ide/vscode/src/PromptContext.js`

Context chips in their outward shapes.

## Methods

- `PromptContext.toWire(items, readContextText)`: `{ path, kind, startLine?, endLine?, text? }`; a file's text is
  read at send time (errors read as no text).
- `PromptContext.toChips(items)`: `{ id, kind, path, startLine?, endLine? }` for the page.
- `PromptContext.withItem(items, item)`: one chip per path and range.
