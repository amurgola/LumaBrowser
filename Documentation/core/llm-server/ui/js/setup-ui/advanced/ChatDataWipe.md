# ChatDataWipe

`core/llm-server/ui/js/setup-ui/advanced/ChatDataWipe.js`

The Data sub-tab's "Clear conversations & artifacts": wipes the store and reloads the tab so every surface re-reads it.

## Methods

- `new ChatDataWipe({ api, doc?, reload? })`; `wire()` (once), `run(button)`, `doneText(deleted)`.

## Globals

Calls `window.location.reload` by default; dialogs through [Dialogs](../../dialogs/Dialogs.md).
