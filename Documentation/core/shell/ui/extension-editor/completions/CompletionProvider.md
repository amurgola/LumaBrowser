# CompletionProvider

`core/shell/ui/extension-editor/completions/CompletionProvider.js`

- `new CompletionProvider(monaco, { data, extensionId, currentFile })`,
  `register()` (javascript, trigger characters `. ( " ' / c`),
  `provide(model, position)` -> `{ suggestions }` from every source in order.
- `CompletionProvider.fileNameOf(path)` (either separator).
