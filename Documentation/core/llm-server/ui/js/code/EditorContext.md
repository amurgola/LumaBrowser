# EditorContext

`core/llm-server/ui/js/code/EditorContext.js`

Context chips for the chat: the selection (line range; a selection ending at
column 1 excludes that line) capped at 24,000 characters, or the whole file at
48,000.

## Methods

- `fromEditor(editor, path, entry)`, `fromPath(path, openFiles, client)` (the
  open text, else the file on disk; images give `null`).
