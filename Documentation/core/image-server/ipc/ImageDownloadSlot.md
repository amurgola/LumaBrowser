# ImageDownloadSlot

`core/image-server/ipc/ImageDownloadSlot.js`

The one image download allowed at a time: catalog models, URL and repo imports, curated LoRAs and companion-file updates share it, one progress channel and one Cancel button.

## Methods

- `new ImageDownloadSlot({ download? })` (`download` defaults to `ImageModelDownload.create`).
- `busy`, `cancel()`.
- `run({ files, dir, send, start, onDownloaded, busyError? })` refuses with `busyError` (default `A model download is already in progress.`) when busy; otherwise sends `start`, downloads with progress on `send`, and returns `onDownloaded()`'s result. A cancel sends `canceled` and resolves `{ success: false, canceled: true }`. The slot is freed in every case.
- `ImageDownloadSlot.reportingFailures(send, fn)` runs `fn`; a throw is sent as `error { message }` and resolved as `{ success: false, error }`.
- `ImageDownloadSlot.startFiles(files)` the `start` payload's `[{ role, file }]`.

## Why

A LoRA must not race a multi-GB model download for disk and bandwidth, and the existing progress strip and Cancel button work unchanged for every kind of download.
