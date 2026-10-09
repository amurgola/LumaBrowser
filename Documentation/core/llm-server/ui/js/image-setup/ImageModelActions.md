# ImageModelActions

`core/llm-server/ui/js/image-setup/ImageModelActions.js`

Routes the image model rows' buttons: `dl` and `dl-nc` (license confirm first; sends the picked quant), `dl-cancel`, `pin` (the default of the button's category), `move` (set the stored kind), `loras`, `update-file` (companion file swap) and `uninstall` (confirm first).

## Methods

- `handle(row, act, event, btn)`: the ModelList `onAction` for both image lists.

## Globals

Reads `window.LumaModal` / native dialogs through Dialogs.
