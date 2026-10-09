# extension-editor-preload

`core/shell/extension-editor-preload.js`

Preload of the extension code editor window. The window is sandboxed, so this
is ONE self-contained CommonJS file that requires only `electron` (the allowed
exception for sandboxed preloads; it has no class).

## Exposes

`window.extensionEditorAPI` (frozen), nothing else:

| Method | Channel |
|---|---|
| `listFiles()` | `core.shell.listExtensionFiles` |
| `readFile(name)` | `core.shell.readExtensionFile`, `String(name)` |
| `writeFile(name, content)` | `core.shell.writeExtensionFile`, `String(name)`, `String(content)` |
| `autocompleteData()` | `core.shell.getExtensionAutocompleteData` |

No folder and no extension id cross the bridge: main answers each call for the
extension it opened the sending window on
([ExtensionEditorWindows](extension-admin/ExtensionEditorWindows.md)), and
refuses every other sender. No `ipcRenderer`, `require` or Node object reaches
the page.
