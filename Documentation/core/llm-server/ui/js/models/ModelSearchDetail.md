# ModelSearchDetail

`core/llm-server/ui/js/models/ModelSearchDetail.js`

The right pane of [ModelSearch](ModelSearch.md): repo facts (params, context, architecture), a quant `<select>` with fit notes, the fit badge, the download bar of the selected quant, and the model card through [ReadmeRenderer](ReadmeRenderer.md).

## Methods

- `render(info, readme)`; `pickQuant(info, index)` (ignored while downloading); `renderDownloadBar()`.
- `ModelSearchDetail.selection(info, variant)` returns `{ repoId, url, file, quant, approxBytes, mlx, parts }`; `parts` lists every part URL of a sharded quant with more than one part.

## Globals

None.
