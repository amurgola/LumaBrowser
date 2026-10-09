# DialogHandler

`core/browser/tab-manager/DialogHandler.js`

handle_dialog: replaces alert, confirm and prompt.

## Methods

- `DialogHandler.install(page, { action = 'accept', promptText })` -> `data: { action, message }`.
  Later dialogs answer with `action` (prompt gets `promptText`, else its default) and are logged in
  `window.__dialogHistory`.
- `DialogHandler.script(options)`.
