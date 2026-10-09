# Dialogs

`core/llm-server/ui/js/dialogs/Dialogs.js`

Promise-returning alert, confirm and prompt for module code.

## Methods

- `Dialogs.alert(message, opts?)` resolves when dismissed.
- `Dialogs.confirm(message, opts?)` resolves a boolean. `opts`:
  `{ title, okLabel, cancelLabel, danger }`.
- `Dialogs.prompt(message, defaultValue?, opts?)` resolves the text, or `null`
  when cancelled.

Each call uses the themed `window.LumaModal` (from the classic
[luma-modal.js](../../../../shell/ui/luma-modal.md)) when the page loaded it, and
otherwise the native dialog wrapped in a promise, so callers always `await` one
shape.

## Globals

Reads `window.LumaModal`, `window.alert`, `window.confirm`, `window.prompt`.
