# ExtensionEditorWindows

`core/shell/extension-admin/ExtensionEditorWindows.js`

Opens extension code editor windows and remembers which extension folder each
one edits, so the editor IPC answers only that window and only inside that
folder.

## Methods

- `new ExtensionEditorWindows({ resolver })`: `resolver` is an
  [ExtensionFolderResolver](ExtensionFolderResolver.md).
- `ExtensionEditorWindows.options(extensionId)` (static): 1000x700, title
  `Edit Extension: <id>`, `webPreferences` exactly
  `{ preload: extension-editor-preload.js, contextIsolation: true, sandbox: true,
  nodeIntegration: false, nodeIntegrationInSubFrames: false, webviewTag: false }`.
  There is no remote module (removed from Electron), so nothing to switch off.
- `open(extensionId)`: resolves the folder; unknown id ->
  `{ success: false, error: 'Extension "<id>" not found' }` and no window.
  Otherwise creates the window, records `{ extensionId, dir }` under its
  webContents id (dropped on `closed`), denies `window.open` and every
  `will-navigate`, loads `core/shell/extension-editor.html` with query
  `{ dir, id }` and returns `{ success: true }`. `dir` in the query only
  prefixes Monaco model URIs; file access never reads it.
- `sessionOf(event)`: the `{ extensionId, dir }` for an IPC event from an editor
  window's main frame. Throws `Not an extension editor window` for any other
  webContents, a subframe, a missing (destroyed) frame or a closed editor.

## Statics

`SIZE`, `PRELOAD_PATH` (`core/shell/extension-editor-preload.js`), `HTML_PATH`
(`core/shell/extension-editor.html`).
