# ImageModelsCard

`core/llm-server/ui/js/image-setup/ImageModelsCard.js`

The Image Models card: a one-time scaffold of two remembered folds holding two STABLE [ModelList](../models/ModelList.md) mounts (`mlImgInstalled` with the image library scan, `mlImgCatalog` with the quant pickers), plus repainted chrome: the download error banner, the models-folder controls, the empty note, "+ Import custom model" and the fine-tune hint.

## Methods

- `paint()`; `onModelEvent(evt)` (start: full repaint; file-start and download: one-row patch; done, canceled, error: refresh models and defaults); `patchDownloadRow()`; `paintInstalledMeta()` (count plus the model per job); `paintCatalogMeta()` (count left plus "downloading N%"); `onQuantChange(row, control)` (updates the size chip in place so the open dropdown stays open).
- `ImageModelsCard.newDownload(payload)`, `applyProgress(dl, type, payload)`, `jobsByModel(installed, defaults)`.
- Installed models are hidden from the catalogue; the first run (nothing installed, no stored fold) opens it.

## Globals

Reads `window.localStorage` (`luma.setup.fold.image.modelCatalogue`).
