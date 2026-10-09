# EditorMonaco

`core/shell/ui/extension-editor/EditorMonaco.js`

- `EditorMonaco.load(win)`: uses the AMD `require` that the page's vendor
  script tag (`../../node_modules/monaco-editor/min/vs/loader.js`) defines,
  configures `vs` as `VS_PATH` (`../../node_modules/monaco-editor/min/vs`)
  resolved against `win.location.href` (a `file://` URL, works inside the
  asar), loads `vs/editor/editor.main` and resolves `window.monaco` (or the
  module). Rejects `Monaco loader.js is not loaded` without the loader, and with
  the loader's error when the load fails.
- `EditorMonaco.createEditor(monaco, container)` with `EDITOR_OPTIONS` (vs-dark,
  13 px, no minimap, automatic layout, tab size 2, quick suggestions outside
  comments and strings).
- `EditorMonaco.languageFor(fileName)`: js, json, html, css, md, else plaintext.

This window does not use the shared MonacoLoader: it loads from `file://`, not
from `/llm-ui/lib/monaco`.
