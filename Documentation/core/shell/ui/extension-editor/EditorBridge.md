# EditorBridge

`core/shell/ui/extension-editor/EditorBridge.js`

The editor's only calls to main, through the preload's `window.extensionEditorAPI`
([extension-editor-preload](../../extension-editor-preload.md)):
`listFiles()`, `readFile(name)`, `writeFile(name, content)` and
`autocompleteData()`. No folder or extension id is sent: main answers for the
extension it opened the window on.

- `new EditorBridge(api)`: `api` is the preload API (tests pass a stand-in).
- `EditorBridge.fromWindow(win)`: takes `win.extensionEditorAPI`; throws
  `extensionEditorAPI is missing: the editor must load with its preload` without
  it (never falls back to Node).
