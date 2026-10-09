# Extension editor window

`core/shell/ui/extension-editor/` (page: `core/shell/extension-editor.html`, opened by
[ExtensionEditorWindows](../../extension-admin/ExtensionEditorWindows.md) for `core.shell.openExtensionEditor`)

The extension code editor: a file list and Monaco over one extension folder.
Start with [ExtensionEditor](ExtensionEditor.md). The page loads
`ui/luma-modal.js` (classic, themed alert/confirm/prompt), Monaco's vendor AMD
loader `../../node_modules/monaco-editor/min/vs/loader.js` (classic), the three
CSS files `css/editor-base.css`, `editor-toolbar.css`, `editor-files.css` (from
the inline style, same rules) and one module, `ui/extension-editor/entry.js`.

## Security

The window runs with `contextIsolation: true, sandbox: true,
nodeIntegration: false` (no webview tag, `window.open` and navigation denied)
and the preload [extension-editor-preload](../../extension-editor-preload.md),
which exposes only `window.extensionEditorAPI`
(`listFiles`, `readFile`, `writeFile`, `autocompleteData`).

Main opens the window for an extension id and resolves the folder itself
([ExtensionFolderResolver](../../extension-admin/ExtensionFolderResolver.md)).
The file and autocomplete channels answer only that window's main frame, for
that extension, and [ExtensionSourceFiles](../../extension-admin/ExtensionSourceFiles.md)
refuses any name that is not a plain file directly inside the folder (`..`,
separators, absolute paths, links escaping it). The `?dir=` query is the
resolved folder and only prefixes Monaco model URIs.

Only [EditorBridge](EditorBridge.md) (the preload API) and
[EditorMonaco](EditorMonaco.md) (the AMD loader) touch the environment.

## Globals

Reads `window.extensionEditorAPI` (preload), `window.require` (Monaco's AMD
loader, not Node), `window.monaco`, `window.alert` (replaced by luma-modal),
`location.search`, `location.href`.
