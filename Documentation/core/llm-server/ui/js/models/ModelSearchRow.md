# ModelSearchRow

`core/llm-server/ui/js/models/ModelSearchRow.js`

Pure HTML for one Hugging Face search result and the status line above the list of [ModelSearch](ModelSearch.md).

## Methods

- `ModelSearchRow.html(model)` the inner HTML of a `.ms-row` button: the repo id with a `gated` mark, a `.ms-row-facts` line (a `.ms-badge` dot coloured by the row's Q4 fit with the fit label as its hover text, then "27B · 256K · qwen35"), and the download and like counts through [SearchText](SearchText.md).
- `facts(model)` that facts line, or '' when the Hub knows nothing about the repo (an MLX row, or a repo summarised by its vision projector).
- `params(paramsB)` `8.2B`, `27B`, `0.6B`.
- `statusHtml(count, query, hidden)` "30 models · 5 hidden" (the hover text says how many were not chat models and how many were too big for this PC), "4 matches", or "No matches.".

## Why

The row shape is shared with the CivitAI browser's rows ([CivitaiResultRow](../image-setup/CivitaiResultRow.md)), so both modals read the same way.
