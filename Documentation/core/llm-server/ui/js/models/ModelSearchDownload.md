# ModelSearchDownload

`core/llm-server/ui/js/models/ModelSearchDownload.js`

One download started from the model search: subscribes to model events for the progress strip (Resuming, "Part i/n", companion-file labels, bytes, "Verifying x / y GB" while a finished part is sha256-checked), offers Cancel, and reports canceled (progress saved), failed or done. On success it dispatches `luma-models-changed` so Setup rescans.

The verify line was added 2026-11-02: a resumed part whose chunks are all on disk goes straight to the hash, minutes for a 200 GB shard, and without the line the strip sat on "Resuming" the whole time.

## Methods

- `new ModelSearchDownload(search).start()`. Requests `{ mlx: true, repoId }` for MLX, else `{ url, filename, parts, totalBytes }`.

## Globals

Dispatches `luma-models-changed` on window.

## Notes

Bug fixed: legacy set `state.downloading = false` before checking `state`, so closing the modal while a download ran threw a TypeError when the download settled. Proved by "closing mid-download cancels it and the late result does not throw" in ModelSearch.test.js.
