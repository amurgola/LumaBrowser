# DrafterModal

`core/llm-server/ui/js/setup-ui/models/DrafterModal.js`

The "Drafter" dialog for one installed LLM, opened from the row's Drafter button
([LlmModelRow.actionsHtml](LlmModelRow.md)). It is the twin of the image
[LoraModal](../../image-setup/LoraModal.md): it extends the same
[ImageModal](../../image-setup/ImageModal.md) base and uses the same markup classes.

## Methods

- `new DrafterModal(ctx, downloads)`: ctx is the SetupContext (`api`, `library`,
  `refreshLibrary`); downloads is the [DrafterDownloads](DrafterDownloads.md) that owns
  row progress.
- `open(key)`: finds the model by name key in `ctx.library.scan` and shows the picker
  ([DrafterModalMarkup](DrafterModalMarkup.md)); false when the dialog is already
  open or the key is unknown.
- `DrafterModal.choiceOf(value)`: the picker value as an IPC choice (`'auto'`,
  `'off'`, `'mtp'` or `{ path }`).

## Flow

Save calls `api.setModelDrafter({ key, choice })` (main side:
[LlmModelsView.setDrafter](../../../../ipc/LlmModelsView.md)), closes and calls
`ctx.refreshLibrary()`; a refusal stays open with the error in the footer. The
catalog row's Download closes the dialog and hands off to `downloads.start`, so the
progress strip and Cancel live on the row as for the inline offer.

## Globals

None.
