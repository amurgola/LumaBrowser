# ImageModelActions

`core/llm-server/ui/js/image-setup/ImageModelActions.js`

Routes the image model rows' buttons: `dl` and `dl-nc` (license confirm first; sends the picked quant), `dl-cancel`, `pin` (the default of the button's category), `move` (set the stored kind), `loras`, `update-file` (companion file swap), `uninstall` (confirm first), and the faster weights actions `int8-build` (`buildInt8Weights({ id })`; a refusal or failure lands in the error banner, a stop does not), `int8-cancel` (`cancelInt8Weights(id)`) and `int8-remove` (`removeInt8Weights(id)`, no confirmation: the copy is rebuilt in seconds). A build or remove then refreshes the models and the server status, because either stops a slot serving the model.

## Methods

- `handle(row, act, event, btn)`: the ModelList `onAction` for both image lists.

## Globals

Reads `window.LumaModal` / native dialogs through Dialogs.
