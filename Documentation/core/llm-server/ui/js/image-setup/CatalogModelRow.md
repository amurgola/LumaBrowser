# CatalogModelRow

`core/llm-server/ui/js/image-setup/CatalogModelRow.js`

`CatalogModelRow.view(model, installed, activeDl, vramBytes)` builds the mlRow view of an image catalog model: category and NC pills, the graphics-memory line, the quant picker (when downloadable and idle), the size chip of the selected quant, and Auto-download, Download (NC), a disabled Download while another runs, or Cancel on the downloading row (which opens to show [DownloadDetail](DownloadDetail.md)).

## Methods

- `CatalogModelRow.kindLabel(model)`.

## Globals

None.

## LoRA trainable badge

`CatalogModelRow.trainablePill(m)` returns the "LoRA trainable" badge for a model that
carries `loraTrainable` (set by ImageModelsView when a trainer add-on registered a recipe
for it), else an empty string. [InstalledModelRow](InstalledModelRow.md) shows the same badge.
