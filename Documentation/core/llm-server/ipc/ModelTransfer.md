# ModelTransfer

`core/llm-server/ipc/ModelTransfer.js`

One model download run across several files with one stable cancel and pause handle.

## Methods

- `new ModelTransfer({ send, download? })` (default `ModelDownload.start`).
- `handle` getter `{ cancel, pause }` for the download slot.
- `stopped` getter, true after cancel or pause.
- `cancel()`, `pause()` (pause also counts as stopped) reach the live file.
- `fetch(url, destPath, onEvent)` starts one file; resolves `ModelDownload`'s result.
- `wasStopped(result)` stopped, or the file reported `canceled` or `paused`.
- `stopOutcome()` sends `paused` and returns `{ success: false, paused: true }`, or
  sends `canceled` and returns `{ success: false, canceled: true }`.

## Why

Swapping handles per file would leave a window where Cancel hits a stale handle and
the next file starts anyway. Pause stops like cancel (partial file and chunk meta
stay); only the reported outcome differs, so the UI can offer Resume.
