# FileCopyProgress

`core/image-server/ipc/FileCopyProgress.js`

Copies a local file with streams and throttled progress callbacks.

## Methods

- `FileCopyProgress.copy(srcPath, destPath, onProgress?)` resolves when written. `onProgress(received, total)` at most every 250 ms, plus a final call with the full size; a throwing listener is ignored. A read failure rejects after the destination stream has closed; a write failure stops the read and rejects.

## Why

Copying a multi-GB checkpoint must not block the main process, and the UI shows the same progress as a network download.
