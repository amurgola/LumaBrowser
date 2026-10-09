# OpenFiles

`core/llm-server/ui/js/code/OpenFiles.js`

The open files in tab order and the active one. A text entry is
`{ model, savedText, dirty, viewState }`, an image `{ image: true, dataUrl, dirty: false }`.

## Methods

- `get/has/set/delete(path)` (delete disposes the model), `paths()`, `entries()`,
  `active()`, `activeText()`, `dirtyCount()`, `hasUnsaved()`, `clear()`; field `activePath`.
