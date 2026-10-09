# ActionPromptModal

`core/shell/ui/settings/ActionPromptModal.js` (ES module)

The form a contributed Extensions action can ask for before launching (manifest `extensionsAction.prompt`).

## Methods

- `ActionPromptModal.open({ title?, subtitle?, submitLabel?, fields })` resolves
  `{ [key]: trimmedValue }` or null (Cancel or a backdrop click). Field types:
  text, `textarea` (`rows`), and `browse: 'directory'` (Browse... calls
  `core.llmServer.pickDirectory({ title })`). A required empty field takes focus
  and keeps the form open.

## Globals

Reads `window.ipcBridge.invoke`.
