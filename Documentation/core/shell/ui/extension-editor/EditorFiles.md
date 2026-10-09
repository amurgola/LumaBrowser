# EditorFiles

`core/shell/ui/extension-editor/EditorFiles.js`

Open files, one Monaco model each (URI `<dir>/<file>`).

- `open(fileName)` reads from disk, reuses an existing model, shows it; `currentFile`.
- `saveCurrent()` -> the saved name or null; rejects on a failed write.
- `saveAll()` -> how many saved (failures logged and skipped).
