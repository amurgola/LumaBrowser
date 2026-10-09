# ExtensionEditor

`core/shell/ui/extension-editor/ExtensionEditor.js` (started by `entry.js`)

## Methods

- `new ExtensionEditor(win, doc, parts)`: `dir` and `id` from the query
  (`unknown` without an id; `dir` only prefixes model URIs); the bridge is
  `EditorBridge.fromWindow(win)` (throws without the preload API); `parts`
  (tests): `{ bridge, loadMonaco }`.
- `start()`: shows the id, wires Save, Save All and Ctrl/Cmd+S, loads Monaco,
  creates the editor, then lists files (opening `manifest.js`) and registers
  autocomplete in parallel.
- `loadFileTree()` ("Error loading files"), `openFile(name)` ("Error opening file"),
  `loadAutocomplete(monaco)` (`bridge.autocompleteData()`; main picks the
  extension; "Autocomplete ready" / "Autocomplete unavailable").
- `save()`: "<file> saved", or an alert "Save failed: <message>" and red status.
- `saveAll()`: "<n> file(s) saved".
