# ImageModelsCard

`core/llm-server/ui/js/image-setup/ImageModelsCard.js`

The Image Models card: a one-time scaffold of two remembered folds holding two STABLE [ModelList](../models/ModelList.md) mounts (`mlImgInstalled` with the image library scan, `mlImgCatalog` with the quant pickers), plus repainted chrome: the download error banner, the models-folder controls, the empty note, "+ Import custom model" and the fine-tune hint.

## Methods

- `paint()` (also reports to the Image tab's [system status line](../setup-ui/system/SystemStatusStrip.md): downloading, a failed download, no models, else the count and folder); `onModelEvent(evt)` (start: full repaint; file-start and download: one-row patch; recipe: stores a CivitAI import's derivation stage on the active download and patches the row; done, canceled, error: refresh models and defaults; `int8-start`, `int8-progress`, `int8-end`: `onInt8Event`);
  `onInt8Event(type, payload)` keeps `store.int8Builds[id]` (dropped on `int8-end`) and patches only that installed row's `dlHtml`; the action's own refresh repaints the row once the build settles; `patchDownloadRow()`; `paintInstalledMeta()` (count plus the model per job); `paintCatalogMeta()` (count left plus "downloading N%"); `onQuantChange(row, control)` (updates the size chip in place so the open dropdown stays open).
- `ImageModelsCard.newDownload(payload)`, `applyProgress(dl, type, payload)`, `jobsByModel(installed, defaults)`, `INT8_EVENTS`.
- Installed models are hidden from the catalogue; the first run (nothing installed, no stored fold) opens it.
- A failed download, move or update is the shared notice markup (`.luma-callout.luma-notice.bad.img-error`,
  `role="alert"`) above the folder row, with the close icon (`data-act="dismiss-err"`).

The catalogue chrome carries two buttons: "Browse CivitAI" ([CivitaiModal](CivitaiModal.md)) and "+ Import custom model" ([ImportModelModal](ImportModelModal.md)), both disabled while a download runs.

## Globals

Reads `window.localStorage` (`luma.setup.fold.image.modelCatalogue`).
