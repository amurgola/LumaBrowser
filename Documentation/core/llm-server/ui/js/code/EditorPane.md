# EditorPane

`core/llm-server/ui/js/code/EditorPane.js`

Opening files into tabs (text into Monaco models, images as previews),
switching without losing cursor and scroll, closing with an unsaved-changes
confirm, the diff toggle and inserting at the caret.

## Methods

- `open(path, { background?, line? })`, `activate(path)`, `close(path, force?)`,
  `markDirty(path)`, `toggleDiff()`, `insertAtCaret(text)`.
