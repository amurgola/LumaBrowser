# RagDocumentImporter

`core/rag/RagDocumentImporter.js`

Adds documents to the knowledge base for the management UI, one
`ragService.ingestFile(path, { scope })` call per file, in order.

## Methods

- `new RagDocumentImporter(ragService, { getMainWindow?, showOpenDialog? })`.
  `showOpenDialog(win, options)` defaults to Electron's `dialog.showOpenDialog`.
- `pickAndIngest()` opens a multi-select dialog ("Add documents to the knowledge
  base"; the extensions of [DocumentParser](DocumentParser.md)`.supportedExtensions()`) parented to the main window, and
  ingests the picks into scope `kb`. Cancelled: `{ success: true, results: [], canceled: true }`.
- `ingest({ path? , paths?, scope? })` ingests one path or a list into `scope`
  (default `kb`); `{ success: false, error: 'No path(s) provided.' }` when there are none.
- Both return `{ success: true, results: [{ path, ...ingestFile result }] }`.
- `RagDocumentImporter.DIALOG_OPTIONS`, `DEFAULT_SCOPE`.
