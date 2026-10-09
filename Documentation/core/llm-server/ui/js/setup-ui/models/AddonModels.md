# AddonModels

`core/llm-server/ui/js/setup-ui/models/AddonModels.js`

The "Add-on models" fold: extension-contributed models bound to their own runtime, each with one "Download & set up" that runs the whole chain main-side, repainted from the streamed add-on events.

## Methods

- `attach(controller)`, `render(body)`, `onAction(row, act, event, button)`, `bindEvents()`, `metaHtml(models)`. A license note is confirmed first; a failed setup shows its error on the row; success or cancel refreshes the library with runtimes.

## Globals

Dialogs through [Dialogs](../../dialogs/Dialogs.md).
