# EditorContext

`ide/vscode/src/EditorContext.js`

Context chips from the editor: the selection (1-based lines; an end at column 0 stops on the line before), a file, an explorer entry; file text read at send time.

## Methods

- `new EditorContext(getRoot)`; `relative(fsPath)`, `fromEditor(editor)`, `fromUri(uri)`, `readContextText(item)`.
- Caps: `MAX_SELECTION_CHARS` 24000, `MAX_FILE_CHARS` 48000, `MAX_FILE_BYTES` 4 MB.
