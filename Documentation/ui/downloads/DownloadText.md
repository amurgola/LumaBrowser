# DownloadText

`ui/downloads/DownloadText.js`

Sizes, statuses and percentages the downloads UI shows: the downloads page, the toolbar's downloads popup and its
button. It lives in the page's folder because the page can only load files from there; the shell imports it from
here.

## Methods

- `bytes(n)`, `status(d)`, `percent(d)`, `aggregatePercent(active)` (static).
- `pageStatus(d)`: the page's status, a finished file's size where the popup says "Done".
- `name(d)`: the name the file was saved under (the save dialog may have changed the suggested one).
- `source(d)`: the site a download came from, without `www.`; empty for a `blob:` or `data:` address.

## Globals

None.
