# ModelSearchDownload

`core/llm-server/ui/js/models/ModelSearchDownload.js`

One download started from the model search: subscribes to model events for the progress strip (Resuming, "Part i/n", companion-file labels, bytes), offers Cancel, and reports canceled (progress saved), failed or done. On success it dispatches `luma-models-changed` so Setup rescans.

## Methods

- `new ModelSearchDownload(search).start()`. Requests `{ mlx: true, repoId }` for MLX, else `{ url, filename, parts, totalBytes }`.

## Globals

Dispatches `luma-models-changed` on window.

## Notes

Bug fixed: legacy set `state.downloading = false` before checking `state`, so closing the modal while a download ran threw a TypeError when the download settled. Proved by "closing mid-download cancels it and the late result does not throw" in ModelSearch.test.js.
