# FilterWorkerLauncher

`core/adblocker/FilterWorkerLauncher.js`

Runs the filter engine build in a short-lived `worker_threads` worker
(`core/adblocker/filterWorker.js`) and resolves with the serialized engine bytes.

## Methods

- `FilterWorkerLauncher.build(cachePath)` resolves with the bytes the worker
  posts. Rejects on a worker `error`, on an `exit` before any message
  ("Filter worker exited without an engine (<code>)"), or after `TIMEOUT_MS`
  (60 s, "Filter initialization timed out"). The worker is terminated in every case.
- `FilterWorkerLauncher.ENTRY`, `TIMEOUT_MS`, `THREAD_NAME`.

## Why the timeout

The first build downloads the filter lists. A hung download would otherwise
leave the worker and its memory alive for the whole session.
