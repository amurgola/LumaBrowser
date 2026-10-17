# ModelFitScene

`tools/docs/readme-shots/ModelFitScene.js`

The "Search models" dialog with a fit badge. `prepare(page, { query, quant, log })` clicks the Models directory
card's search icon (`title="Search for models to download"`), types `query` into `.ms-search-in`, waits for a result
row whose repo id contains the query's repo name (the dialog opens on a default list, so the first row that exists
is not necessarily an answer to this query; clicking it once showed another model's card), clicks that row, waits
for the detail pane to name the repo with a quantization verdict and no loading placeholder, selects the
quantization whose option starts with `quant` when the repo offers it (change event dispatched so the fit line and
Download row follow), scrubs with [PageSanitizer](PageSanitizer.md), and returns `{ clip, repoId }`.

`dialogClip` is the dialog box inside `.ms-overlay`, in CSS pixels, from its top edge through the Download row plus
`BOTTOM_PAD_PX`: the README wants the fit verdict, not the model card below it. `capture(page, clip, outPath)` is a
Playwright page screenshot of that clip at device scale, so the PNG is just the dialog, no window. `close(page)`
clicks the dialog's X so the chat scene can follow.

Needs the Setup page showing ([SetupScene](SetupScene.md) runs first) and network access to Hugging Face.

## Methods

- `static prepare(page, { query, quant, log })`.
- `_selectMatch(page, query)`: waits for and clicks the matching row; returns its repo id.
- `_pickQuant(page, quant)`: the option text selected, or null.
- `_waitForDetail(page, repoId)`.
- `static dialogClip(page)`: `{ x, y, width, height }`.
- `static capture(page, clip, outPath)`.
- `static close(page)`.
