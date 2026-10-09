# ExtensionExporter

`core/shell/extension-admin/ExtensionExporter.js`

Exports an extension folder as a shareable .zip.

## Methods

- `new ExtensionExporter({ archiver? })` (the `archiver` module, injectable).
- `export(extensionId, extDir, chooseSavePath)` never throws. Needs
  `<extDir>/manifest.js` (`Extension manifest not found`) and refuses private
  extensions (`Cannot export a private extension`). `chooseSavePath(manifest)`
  resolves the target file or null (`{ canceled: true }`). The folder is zipped
  (level 9) under a top folder named after the extension id: `{ success: true, filePath }`.
