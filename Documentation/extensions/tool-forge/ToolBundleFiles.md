# ToolBundleFiles

`extensions/tool-forge/ToolBundleFiles.js`

Moves tool bundles between disk and the forge through the native dialogs.

## Methods

- `new ToolBundleFiles({ service, store, dialog, fileSystem = fs })`; `dialog`
  defaults to Electron's, required lazily.
- `exportTool(name)`: save dialog (`Export tool "<name>"`, default
  `fileNameFor(name)`, filter `Luma tool` / `json`), writes
  `service.exportBundle(name)` pretty-printed. `{ canceled: true }` or
  `{ canceled: false, filePath }`; `Tool not found` for an unknown tool.
- `importTool()`: open dialog, parses the file (`Could not read that file as a
  tool export: <reason>`), `service.importBundle(bundle)`;
  `{ canceled: false, name, warnings }` or `{ canceled: true }`.
- `ToolBundleFiles.fileNameFor(name)`: `<>:"/\|?*` runs -> `_`, plus `.tool.json`.
