# ModelSearchDetail

`core/llm-server/ui/js/models/ModelSearchDetail.js`

The right pane of [ModelSearch](ModelSearch.md): repo facts (params, context, architecture), a quant `<select>` with fit notes, the fit badge, the download bar of the selected quant, and the model card through [ReadmeRenderer](ReadmeRenderer.md).

## Methods

- `render(info, readme)`; `pickQuant(info, index)` (ignored while downloading); `renderDownloadBar()`.
- A pack repo (`info.extension` set) titles the picker "Pack", preselects its first (smallest) pack instead of
  asking `QuantVariantPicker`, and shows no fit badge; a variant with no `fit` hides the badge for any format, so
  a green dot never claims a fit nobody estimated.
- `ModelSearchDetail.selection(info, variant)` returns `{ repoId, url, file, quant, approxBytes, mlx, parts }`; `parts` lists every part URL of a sharded quant with more than one part.

## Globals

None.
