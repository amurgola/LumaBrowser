# DownloadDetail

`core/llm-server/ui/js/image-setup/DownloadDetail.js`

`DownloadDetail.html(dl)`: the in-row progress block of the downloading catalog row ("File n of m · role", bar, percent and bytes, or "starting…"), plus one line from `recipeLine(dl.recipe)` for a CivitAI import: "Reading the CivitAI page and sample images..." while the derivation runs, then which settings came from the model page and which from the sample images (and the first warning, such as a sampler stand-in), or the base-settings fallback when nothing was found or the read failed.

## Globals

None.
