# CivitaiModal

`core/llm-server/ui/js/image-setup/CivitaiModal.js`

"Browse CivitAI", the image twin of the LLM [ModelSearch](../models/ModelSearch.md) modal and built on the same `.ms-*` two-pane shell. Left: a search box (a query, debounced 250 ms, or a pasted CivitAI model URL), the sort, the type and base-group filters with the adult-content toggle, the status line, the result rows, a load-more footer and the API key fold. Right: the picked model's page, sample images, version picker with its install verdict and the Install button. An install closes the modal; the Models card shows the download and the settings derivation (`recipe` events, see [DownloadDetail](DownloadDetail.md)).

## Methods

- `open()` (ignored while open): paints the filters, loads the settings (`getCivitaiSettings`), focuses the search box and runs the default search (checkpoints, installable bases, most downloaded). `close()` also stops a pending debounce.
- `search({ more? })` `civitaiSearch` with the query, type, base group, sort and (for `more`) the cursor; a fresh search replaces the list, `more` appends the next page. The answer's `filters` refill the selects. A query that is a civitai.com URL goes to `openUrl` instead. Stale answers are dropped by a sequence number.
- `openUrl(url)` `civitaiPreview({ url })`; the model becomes the only row ("Model page") and is selected.
- `select(modelId, versionId?)` marks the row, loads the detail (`civitaiPreview({ modelId, versionId })`) and paints [CivitaiResultRow](CivitaiResultRow.md)`.detailHtml` with the page through [ReadmeRenderer](../models/ReadmeRenderer.md). The version `<select>` re-selects with the chosen version. Hovering a row starts the same load, and a click reuses it; a refusal is shown and forgotten so a retry asks again.
- `install({ modelId, versionId, fileId? }, button?)` refuses while another download runs, calls `importModelFromCivitai`, closes on success and shows the refusal otherwise.
- Settings: Save and Clear on the key row and the Adult checkbox call `setCivitaiSettings`; the key field is emptied after a save and the summary shows `(saved)`, `(from environment)` or `(none)`.
- Page links and the open button go through the panel's `openExternal`.

## Globals

None beyond ImageModal.
